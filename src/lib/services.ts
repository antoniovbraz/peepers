import { MLApiService } from '@/services/ml-api.service';
import { CacheService } from '@/services/cache.service';

export const mlApi = new MLApiService();
export const cache = new CacheService();