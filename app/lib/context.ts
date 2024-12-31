import {createHydrogenContext} from '@shopify/hydrogen';
import {AppSession} from '~/lib/session';
import {CART_QUERY_FRAGMENT} from '~/lib/fragments';
import {getLocaleFromRequest} from '~/lib/i18n';
import {createFastSimonClient, FastSimonSession} from '@fast-simon/storefront-kit';

/**
 * The context implementation is separate from server.ts
 * so that type can be extracted for AppLoadContext
 * */
export async function createAppLoadContext(
  request: Request,
  env: Env,
  executionContext: ExecutionContext,
) {
  /**
   * Open a cache instance in the worker and a custom session instance.
   */
  if (!env?.SESSION_SECRET) {
    throw new Error('SESSION_SECRET environment variable is not set');
  }

  const waitUntil = executionContext.waitUntil.bind(executionContext);

  const [cache, session, fastSimonSession] = await Promise.all([
    caches.open('hydrogen'),
    AppSession.init(request, [env.SESSION_SECRET]),
    FastSimonSession.init(request, [env.SESSION_SECRET]),
  ]);

  const hydrogenContext = createHydrogenContext({
    env,
    request,
    cache,
    waitUntil,
    session,
    i18n: getLocaleFromRequest(request),
    cart: {
      queryFragment: CART_QUERY_FRAGMENT,
    },
  });

  const fastSimon = createFastSimonClient({
    cache,
    waitUntil,
    request,
    uuid: '3eb6c1d2-152d-4e92-9c29-28eecc232373',
    storeID: '55906173135',
    fastSimonSession,
    searchPersonalization: true,
    collectionPersonalization: true
  });

  return {
    ...hydrogenContext,
    fastSimon,
    fastSimonSession
  };
}
