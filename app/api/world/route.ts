import {env} from 'cloudflare:workers';
import {handleWorld} from '../../../lib/world-api.mjs';
export function POST(request:Request){return handleWorld(request,env.DB)}
