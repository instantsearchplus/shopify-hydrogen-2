import {FastSimonAnalytics} from '@fast-simon/storefront-kit';
import {useAnalytics} from '@shopify/hydrogen';

export function FastSimonTracking({storeId, uuid, storeDomain}: {storeId: string, uuid: string, storeDomain: string}) {
  const analyticsContextValue = useAnalytics();
  return <FastSimonAnalytics storeId={storeId} uuid={uuid} storeDomain={storeDomain} searchPersonalization={true} collectionPersonalization={true} analyticsContextValue={analyticsContextValue}/>

}