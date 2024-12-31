import {ActionFunctionArgs} from '@shopify/remix-oxygen';
import {fastSimonTrackingUtils} from '@fast-simon/storefront-kit';

export let loader = ({ request, context }) => {
  return fastSimonTrackingUtils.getViewedProducts({ request, context });
};

export async function action({request, context}: ActionFunctionArgs) {
  return fastSimonTrackingUtils.setPersonalizationData({request, context});
}