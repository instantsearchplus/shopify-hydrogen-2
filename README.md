# Fast Simon & Shopify Integration
Build Search and Discovery experience with Fast Simon, a Shopify Plus Certified Partner

[Getting started guide](https://instantsearchplus.zendesk.com/hc/en-us/categories/360000839131-Getting-Started-with-Fast-Simon)

# Hydrogen template: Skeleton with Fast Simon Visual Similarity, Smart Collection and Search Results Page

- Hydrogen is Shopify’s stack for headless commerce. Hydrogen is designed to dovetail with [Remix](https://remix.run/), Shopify’s full stack web framework. This template contains a **minimal setup** of components, queries and tooling to get started with Hydrogen.

- This demo store is a clone of the demo-store template provided by Shopify with examples of how to integrate the Fast Simon Visual Similarity.

- [Check out the Visual Similarity feature in a Shopify Hydrogen demo store](https://shopify-hydrogen-2-b10004a9e68ce7a318e7.o2.myshopify.dev/products/mens-muscle-top)

[Check out Hydrogen docs](https://shopify.dev/custom-storefronts/hydrogen)
[Get familiar with Remix](https://remix.run/docs/en/v1)

## What's included

- Fast Simon Visual Similarity 
- Fast Simon Smart Collections
- Fast Simon Instant Search Autocomplete
- Fast Simon Search Results Page
- Remix
- Hydrogen
- Oxygen
- Shopify CLI
- ESLint
- Prettier
- GraphQL generator
- TypeScript and JavaScript flavors
- Minimal setup of components and routes


# Fast Simon For Shopify Hydrogen
React NPM package to support Fast Simon tools in Shopify Hydrogen Projects.

# What is Fast Simon for Shopify Hydrogen?
Fast Simon Shopify Hydrogen is a React library to be used in Shopify Hydrogen apps.
By installing the library on your Hydrogen-based Shopify storefront, you will be able to fetch Fast Simon data and render Fast Simon components in your app.

# Installation Guide
This document will guide you to:
* Configure your Shopify store ready for Fast Simon Shopify Hydrogen.
* Install Fast Simon app on your Shopify store.
* Install Fast Simon Shopify Hydrogen NPM library.
* Render Visual Similarity widget. 

# Getting started

**Requirements:**
* Node.js version 16.14.0 or higher
* Shopify store
* Hydrogen app
* Fast Simon app installed on your Shopify store

**Next Steps:**
* Go to Fast Simon Dashboard -> Upsell & Cross-sell -> Advanced Configuration -> Turn the Look-a-like Visually Similar Recommendations switch on.
* Make sure that Collections, Search Results Page, and Autocomplete are enabled in Fast Simon Dashboard.

## Installation
**To install the package into your project, run:**
```bash
npm install @fast-simon/storefront-kit
npm install @fast-simon/utilities
```

## Local development
```bash
npm install
```
```bash
npm run dev
```

## Fast Simon Context API
#### The following simple example shows how to add Fast Simon API to the Remix context, and simply query your data from any route.
- Go to `/app/lib/context.ts` directory in your Hydrogen project
- import `createFastSimonClient` from `@fast-simon/storefront-kit`.
- Invoke createFastSimonClient and return it as following:
```js
export async function createAppLoadContext(
  request: Request,
  env: Env,
  executionContext: ExecutionContext
) {
  // ... Existing context creation code here...

  // Create the Fast Simon API Client
  const fastSimon = createFastSimonClient({cache, waitUntil, request, uuid: '{{fast_simon_uuid}}', storeID: '{{fast_simon_store_id}}'});

  return {
    ...hydrogenContext,
    fastSimon,
  };
}
```
- You can now query Fast Simon API from any loader function, on any route, using the same caching utilities that Hydrogen uses to query Shopify's Storefront API.


## Visual Similarity Usage
### Adding Fast Simon fetcher function to the root loader
- Invoke `getVisualSimilarityProducts` in your root loader function, passing the product id as a prop
- Pass down the result to the product page component, you can either await to the promise to resolved (which could have a negative performance impact) or just pass the promise down as a stream.

```ts
export async function loader(args: LoaderFunctionArgs) {
  /* ... Existing product data fetch code here... */
  const visualSimilarityProducts = args.context.fastSimon.getVisualSimilarityProducts({
    props: {
      productId: productId
    },
    cacheStrategy: CacheLong()
  });
  return defer({...someData, visualSimilarityProducts});
}
```

### Using Fast Simon components

After fetching data using the getVisualSimilarityProducts function, you can display the results using components from the @fast-simon/storefront-kit. Here's an example of how to use the FastSimonWidget component along with retrieving the data using the useLoaderData:

```js
import { FastSimonWidget } from '@fast-simon/storefront-kit';

function ProductPage() {

  const {product, visualSimilarityProducts} = useLoaderData<typeof loader>();

  // ... other component logic

  return (
          <div>

            {/* ... other parts of your product page */}

            <FastSimonWidget title={'Similar Products'}
                             products={visualSimilarityProducts}/>

          </div>
  );
}
```

This component will render the visual similarity results in a visually appealing and interactive format.

## Configuration
### `getVisualSimilarityProducts` function
To customize the behavior of the getVisualSimilarityProducts function, you can pass the specs parameter to control aspects like:

- `maxSuggestions` - Max number of similar products to fetch
- `sources` - sources of the results, for example:
  - `similar_products` - products sharing category, tags or keyword similarity with the viewed product
  - `similar_products_by_attributes` - products sharing categories and chosen attributes (requires choosing relevant attributes in Fast Simon dashboard)
  - `similar_products_lookalike` - visually similar products (requires enabling Look-a-like Visually Similar Recommendations in Fast Simon dashboard)
  - `related_top_products` - popular products in the store

Refer to the API documentation for a full list of configurable parameters.
https://docs.fastsimon.com/api#operation/productRecommendations

### `FastSimonWidget` component
You can customize the FastSimonWidget component with various props to match your store's design and layout requirements.

`renderProduct` - a function that receives a product object and returns a React element. This allows you to customize the product card that is rendered for each product in the widget. For example:
```js
  <FastSimonWidget title={'Similar Products'}
                   products={visualSimilarityProducts}
                   renderProduct={(product, pos) => <MyProductCard key={product.id} product={product} />}/>
```


`title` - The title of the widget, for example `Similar Products` or `You may also like`
`breakpoints` - An object of breakpoints to control the number of products displayed in each device. For example:
```js
  <FastSimonWidget title={'Similar Products'}
                   products={visualSimilarityProducts}
                   breakpoints={{
                     mobile: 2,
                     tablet: 3,
                     desktop: 4,
                   }}/>
```

`carouselGap` - The gap between products in the carousel in pixel, default value is 16. For example:
```js
  <FastSimonWidget title={'Similar Products'}
                   products={visualSimilarityProducts}
                   carouselGap={16}/>
```

`RightArrowIcon` - A JSX element to use as the right arrow icon in the carousel. For example:
```js
  <FastSimonWidget title={'Similar Products'}
                   products={visualSimilarityProducts}
                   RightArrowIcon={<MyRightArrowIcon/>}/>
```
Don't worry about the left icon, we are rotating the icon automatically.

`imageAspectRatio` - The aspect ratio of the product image, default value is "2/3". For example:
```js
  <FastSimonWidget title={'Similar Products'}
                   products={visualSimilarityProducts}
                   imageAspectRatio={"2/3"}/>
```


## Smart Collections Usage
### Adding Fast Simon getSmartCollection function to the root loader
- Go to file `routes/collections.$handle.tsx`
- Invoke `getSmartCollection` in your root loader function, passing category URL, page number, sort by and narrow
- Pass down the results to the Collection component.

```js
export async function loader({request, params, context}) {
  // ... other code
  const {handle} = params;

  if (!handle) {
    return redirect('/collections');
  }

  const url = new URL(request.url);
  const page = Number(url.searchParams.get("page")) || 1;
  const narrowString = url.searchParams.get('filters');
  const sortBy = url.searchParams.get('sort');
  const narrow = narrowString ? Narrow.toServerNarrow(Narrow.parseNarrow(narrowString || '')) : [];
  
  const collection = await fastSimon.getSmartCollection({
    props: {
      categoryURL: '/collections/' + handle,
      page,
      narrow: narrow,
      facetsRequired: true,
      productsPerPage: 20,
      categoryID: undefined,
      sortBy: sortBy
    },
  });

  if (!collection) {
    throw new Response(`Collection ${handle} not found`, {
      status: 404,
    });
  }
  const transformed = transformToShopifyStructure(collection.items);
  collection.products = transformed.products;
  collection.handle = collection.category_url.split('/')[1];
  collection.title = collection.category_name;
  collection.description = collection.category_description;
  const facets = {facets: criticalData.collection.getFacetsOnly ? criticalData.collection.getFacetsOnly() : criticalData.collection.facets};
  return defer({collection, ...facets});
}

```
In the above example, we simply translated the Fast Simon results to the form of Shopify GraphQL using `transformToShopifyStructure` in order to use Shopify template components, but this step is optional and not required if you have your own components. 

For facets, there are two scenarios in order to optimize speed:
1. Facets are ready within the collection response - in this case we simply assign the facets value and pass it down with the rest of the data
2. Facets are not ready - in this case, the collection response contains a callback function called getFacetsOnly. This function returns a Promise and we passing this promise down to the stream. 

For deeper insight on how to render the streamed facets, please refer to the `Filters` component in this sample site.


## Search Results Page Usage
### Adding Fast Simon fetcher function to the root loader
- Go to file `routes/search.tsx`
- Invoke `getSearchResults` in your root loader function, passing the search query, page number, sort by and narrow
- Pass down the results to the search component.

```js
async function regularSearch({
                               request,
                               context,
                             }: Pick<
  LoaderFunctionArgs,
  'request' | 'context'
>): Promise<RegularSearchReturn> {
  const {fastSimon} = context;
  const url = new URL(request.url);
  const term = String(url.searchParams.get('q') || '');
  const page = Number(url.searchParams.get('page') || 1);
  const sortBy = url.searchParams.get('sort');
  const narrowString = url.searchParams.get('filters');
  const narrow = narrowString ? Narrow.toServerNarrow(Narrow.parseNarrow(narrowString || '')) : []

  const fastSimonSearchResults = await fastSimon.getSearchResults({
    props: {
      page: page,
      narrow: narrow,
      facetsRequired: 1,
      query: term,
      productsPerPage: 20,
      sortBy: sortBy
    }
  });

  if (!fastSimonSearchResults) {
    throw new Error('No search data returned from FastSimon API');
  }
  
  const transformed = transformToShopifyStructure(fastSimonSearchResults.items);
  const facets = fastSimonSearchResults.getFacetsOnly ? fastSimonSearchResults.getFacetsOnly() : {};
  return {type: 'regular', term, error: undefined, result: {total: fastSimonSearchResults.total_results, ...fastSimonSearchResults, ...facets, items: transformed}};
}

export async function loader({request, params, context}) {
  const url = new URL(request.url);
  const searchPromise = regularSearch({request, context});
  searchPromise.catch((error: Error) => {
    console.error(error);
    return {term: '', result: null, error: error.message};
  });
  const data = await searchPromise;
  const facets = {facets: data.result.getFacetsOnly ? data.result.getFacetsOnly() : data.result.facets};
  return defer({...data, ...facets});
}
```
In the above example, we simply translated the Fast Simon results to the form of Shopify GraphQL using `transformToShopifyStructure` in order to use Shopify template components, but this step is optional and not required if you have your own components. 

For facets, there are two scenarios in order to optimize speed:
1. Facets are ready within the search response - in this case we simply assign the facets value and pass it down with the the rest of the data
2. Facets are not ready - in this case, the search response contains a callback function called getFacetsOnly. This function returns a Promise and we passing this promise down to the stream. 

For more details on how to render the streamed facets, please refer to the `Filters` component in this sample site.


## Autocomplete Usage
### Adding getFastSimonAutocompleteResults function to the root loader
- Go to file `routes/search.tsx`
- Invoke `getAutocompleteResults` in your root loader function, passing the search query
- Pass down the results to the predictive search component.

```js
async function getFastSimonAutocompleteResults({request, context}: LoaderFunctionArgs) {
  const {fastSimon} = context;
  const url = new URL(request.url);
  const term = String(url.searchParams.get('q') || '').trim();

  return await fastSimon.getAutocompleteResults({
    props: {
      query: term
    }
  });
}

async function predictiveSearch({
                                  request,
                                  context,
                                }: Pick<
  ActionFunctionArgs,
  'request' | 'context'
>): Promise<PredictiveSearchReturn> {
  const url = new URL(request.url);
  const term = String(url.searchParams.get('q') || '').trim();

  const type = 'predictive';

  if (!term) return {type, term, result: getEmptyPredictiveSearchResult()};

  const {items} = await getFastSimonAutocompleteResults({request, context});

  if (!items) {
    throw new Error('No predictive search data returned from Shopify API');
  }

  const total = Object.values(items).reduce(
    (acc, item) => acc + item.length,
    0,
  );

  return {type, term, result: {items, total}};
}

export async function loader({request, context}: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const isPredictive = url.searchParams.has('predictive');
  const searchPromise = isPredictive
    ? predictiveSearch({request, context})
    : regularSearch({request, context});

  searchPromise.catch((error: Error) => {
    console.error(error);
    return {term: '', result: null, error: error.message};
  });
  const data = await searchPromise;

  if(data?.type === 'regular') {
    const facets = {facets: data.result.getFacetsOnly ? data.result.getFacetsOnly() : data.result.facets};
    const dashboardConfig = {dashboardConfig: context.fastSimon.getDashboardConfig({cacheStrategy: CacheLong()})};
    return defer({...data, ...facets, ...dashboardConfig});
  }
  return json(data);
}
```

In the above example we wrapped up the regular search and autocomplete together as Shopify does in the original template.

For more detailed examples, how to use the data and render it, please refer to this project components. 

For any issues, questions, or suggestions, please contact our support team.
