import * as _ from "lodash";
import { ITenantManager } from "../api-core";
import * as utils from "../utils";
import { IAlfredTenant } from "./tenant";

/**
 * Helper function to return tenant specific configuration
 */
export async function getConfig(
    config: any,
    tenantManager: ITenantManager,
    tenantId: string,
    direct = false): Promise<string> {

    // Make a copy of the config to avoid destructive modifications to the original
    const updatedConfig = _.cloneDeep(config);

    const tenant = await tenantManager.getTenant(tenantId);
    updatedConfig.owner = tenant.storage.owner;
    updatedConfig.repository = tenant.storage.repository;

    if (direct) {
        updatedConfig.credentials = tenant.storage.credentials;
        updatedConfig.blobStorageUrl = tenant.storage.direct;
        updatedConfig.historianApi = false;
    } else {
        const url = tenant.storage.url;
        updatedConfig.blobStorageUrl = url.replace("historian:3000", "localhost:3001");
        updatedConfig.historianApi = true;
    }

    return JSON.stringify(updatedConfig);
}

export function getToken(tenantId: string, documentId: string, tenants: IAlfredTenant[]): string {
    for (const tenant of tenants) {
        if (tenantId === tenant.id) {
            return utils.generateToken(tenantId, documentId, tenant.key);
        }
    }

    throw new Error("Invalid tenant");
}
