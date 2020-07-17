import axios from 'axios';
import rateLimit from 'axios-rate-limit';

const KANKA_BASE_URL = 'https://kanka.io/api/1.0/campaigns';

let instance = null;

function setupAxios(baseURL, accessToken) {
    instance = rateLimit(axios.create({
        baseURL: baseURL
    }),
        {
            maxRequests: 30,
            perMilliseconds: 1000 * 60,
        });
    instance.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
}

async function _fetchPage(path, params) {
    const response = await instance.get(path, { params });
    if (response.data) {
        return response.data;
    }
}

async function getAllOfEntity(entityPath) {
    let currentPage = 1;
    let lastPage = 100;
    let entityList = [];
    while (currentPage <= lastPage) {
        const res = await _fetchPage(entityPath, { page: currentPage });
        entityList = entityList.concat(res.data);
        currentPage++;
        lastPage = res.meta.last_page;
    }
    return entityList;
}

async function getllAllUntaggedOfType(theType, compareStats) {
    const entities = await getAllOfEntity(`/${theType}`);
    const untagged = entities.filter(x => x.tags && x.tags.length === 0);
    if (compareStats) {
        console.log(untagged.length, 'untagged of', entities.length);
    }
    return untagged;
}

async function tagEntity(entityId, tagId) {
    try {
        if (!entityId) throw new Error('Missing entity id');
        if (!tagId) throw new Error('Missing tag id');
        console.log(`Tagging entity ${entityId} with tag ${tagId}`)
        const result = await instance.post(`/entities/${entityId}/entity_tags`, { entity_id: entityId, tag_id: tagId });
        if (result.data) {
            return result.data;
        }
    } catch (e) {
        console.error('tagentity', e);
    }
}

async function createTag(body) {
    try {
        const result = await instance.post('/tags', body);
        if (result.data) {
            return result.data.data.id;
        }
    } catch (e) {
        console.error('createUntaggedTag', e);
    }
}

export {
    createTag,
    tagEntity,
    getllAllUntaggedOfType,
    setupAxios,
    instance,
    KANKA_BASE_URL,
};
