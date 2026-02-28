import { BaseCRMAction } from './BaseCRMAction';
import { HttpMethod } from '../constants/HttpMethod';

export class Segments extends BaseCRMAction {
    /**
     * Update a CRM segment.
     *
     * @param segmentId - ID of the segment to update
     * @param params - additional parameters for the update
     */
    async update(segmentId: number, params: Record<string, unknown> = {}): Promise<Record<string, unknown>> {
        await this.ensureAuthenticated();
        return this.sendRequest('/api/en/Segment/Update', { SegmentId: segmentId, ...params }, HttpMethod.POST);
    }
}
