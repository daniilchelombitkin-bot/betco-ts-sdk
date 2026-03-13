import 'dotenv/config';
import express from 'express';
import { BetsConstructClient } from './clients/BetsConstructClient';
import { AffiliatesClient } from './clients/AffiliatesClient';
import { CRMClient } from './clients/CRMClient';
import { Credentials } from './Credentials';

const app = express();
app.use(express.json());

const credentials = new Credentials(
    process.env.BC_EMAIL!,
    process.env.BC_PASSWORD!,
    process.env.BC_TOTP_SECRET!,
);

const client = new BetsConstructClient(credentials);
const affiliates = new AffiliatesClient(client, process.env.AFFILIATES_URL ?? '');
const crm = new CRMClient(client, process.env.CRM_URL);

type RpcHandler = (params: Record<string, any>) => Promise<any>;

const methods: Record<string, RpcHandler> = {
    // users
    'users.get':                      (p) => client.users().get(p.userId),
    'users.getKPI':                   (p) => client.users().getKPI(p.userId),
    'users.update':                   (p) => client.users().update(p.userId, p.data),
    'users.updatePassword':           (p) => client.users().updatePassword(p.userId, p.password),
    'users.getAccounts':              (p) => client.users().getAccounts(p.userId),
    'users.getBonuses':               (p) => client.users().getBonuses(p.clientId, p.params),
    'users.createPaymentDocument':    (p) => client.users().createPaymentDocument(p.clientId, p.currency, p.amount, p.type, p.params),
    'users.attachBonus':              (p) => client.users().attachBonus(p.clientId, p.bonusId, p.amount, p.type, p.params),
    'users.search':                   (p) => client.users().search(p),
    'users.updateClientDetails':      (p) => client.users().updateClientDetails(p as any),

    // reports
    'reports.getBets':                (p) => client.reports().getBets(p as any),
    'reports.getTurnOverReport':      (p) => client.reports().getTurnOverReport(p as any),
    'reports.getBonusReport':         (p) => client.reports().getBonusReport(p),

    'reports.getRegistrationStatisticsDetails': (p) => client.reports().getRegistrationStatisticsDetails(p as any),

    // bonuses
    'bonuses.getList':                (p) => client.bonuses().getList(p.partnerId, p.params),

    // financials
    'financials.getTransactions':     (p) => client.financials().getTransactions(p),

    // settings
    'settings.getSettings':           (_) => client.settings().getSettings(),
    'settings.saveSetting':           (p) => client.settings().saveSetting(p),

    // promoCodes
    'promoCodes.getClientPromoCodes': (p) => client.promoCodes().getClientPromoCodes(p),
    'promoCodes.create':              (p) => client.promoCodes().create(p as any),

    // affiliates
    'affiliates.players.get':                    (p) => affiliates.players().get(p),
    'affiliates.players.attachPlayerToRefId':     (p) => affiliates.players().attachPlayerToRefId(p as any),

    // crm
    'crm.segments.update':            (p) => crm.segments().update(p.segmentId, p.params),

    // client utils
    'client.changeActiveProject':     (p) => client.changeActiveProject(p.projectId).then(() => ({ ok: true })),
    'client.withPreSelectedPartnerId': (_) => client.withPreSelectedPartnerId().then(() => ({ ok: true })),
};

const API_SECRET = process.env.API_SECRET;

app.post('/rpc', async (req, res) => {
    if (API_SECRET) {
        const auth = req.headers['authorization'];
        if (auth !== `Bearer ${API_SECRET}`) {
            res.status(401).json({ ok: false, error: 'Unauthorized' });
            return;
        }
    }

    const { method, params } = req.body as { method: string; params?: Record<string, any> };

    if (!method || !methods[method]) {
        res.status(400).json({ ok: false, error: `Unknown method: ${method}` });
        return;
    }

    try {
        const result = await methods[method](params ?? {});
        res.json({ ok: true, result });
    } catch (err: any) {
        res.status(500).json({ ok: false, error: err.message, code: err.code ?? null });
    }
});

app.get('/health', (_, res) => res.json({ ok: true }));

const PORT = process.env.PORT ?? 3000;
app.listen(PORT, () => console.log(`SDK server running on :${PORT}`));
