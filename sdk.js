/**
 * BetCo SDK client for bots.
 * Copy this file into your bot project.
 *
 * Required env vars in your bot:
 *   SDK_URL    — e.g. http://YOUR_SERVER_IP:3000
 *   SDK_SECRET — same value as API_SECRET on the SDK server
 */

const SDK_URL = process.env.SDK_URL ?? 'http://localhost:3000';
const SDK_SECRET = process.env.SDK_SECRET;

async function rpc(method, params = {}) {
    const headers = { 'Content-Type': 'application/json' };
    if (SDK_SECRET) headers['Authorization'] = `Bearer ${SDK_SECRET}`;

    const res = await fetch(`${SDK_URL}/rpc`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ method, params }),
    });
    const data = await res.json();
    if (!data.ok) throw new Error(data.error ?? 'SDK error');
    return data.result;
}

module.exports = {
    // users
    getUser:                (userId)                            => rpc('users.get', { userId }),
    getUserKPI:             (userId)                            => rpc('users.getKPI', { userId }),
    updateUser:             (userId, data)                      => rpc('users.update', { userId, data }),
    updatePassword:         (userId, password)                  => rpc('users.updatePassword', { userId, password }),
    getUserAccounts:        (userId)                            => rpc('users.getAccounts', { userId }),
    getUserBonuses:         (clientId, params)                  => rpc('users.getBonuses', { clientId, params }),
    createPaymentDocument:  (clientId, currency, amount, type, params) =>
                                                                   rpc('users.createPaymentDocument', { clientId, currency, amount, type, params }),
    attachBonus:            (clientId, bonusId, amount, type)   => rpc('users.attachBonus', { clientId, bonusId, amount, type }),
    searchUsers:            (params)                            => rpc('users.search', params),
    updateClientDetails:    (params)                            => rpc('users.updateClientDetails', params),

    // reports
    getBets:                (params)                            => rpc('reports.getBets', params),
    getTurnOverReport:      (params)                            => rpc('reports.getTurnOverReport', params),
    getBonusReport:         (params)                            => rpc('reports.getBonusReport', params),

    // bonuses
    getBonusList:           (partnerId, params)                 => rpc('bonuses.getList', { partnerId, params }),

    // financials
    getTransactions:        (params)                            => rpc('financials.getTransactions', params),

    // settings
    getSettings:            ()                                  => rpc('settings.getSettings'),
    saveSetting:            (params)                            => rpc('settings.saveSetting', params),

    // promo codes
    getClientPromoCodes:    (params)                            => rpc('promoCodes.getClientPromoCodes', params),
    createPromoCode:        (params)                            => rpc('promoCodes.create', params),

    // affiliates
    getAffPlayers:          (params)                            => rpc('affiliates.players.get', params),
    attachPlayerToRefId:    (params)                            => rpc('affiliates.players.attachPlayerToRefId', params),

    // crm
    updateSegment:          (segmentId, params)                 => rpc('crm.segments.update', { segmentId, params }),

    // client utils
    changeActiveProject:    (projectId)                         => rpc('client.changeActiveProject', { projectId }),
    withPreSelectedPartnerId: ()                                => rpc('client.withPreSelectedPartnerId'),

    // raw rpc for anything not listed above
    rpc,
};
