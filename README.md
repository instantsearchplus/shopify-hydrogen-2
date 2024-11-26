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

- Fast Simon Visual Similarity integration
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
By installing the library on your Hydrogen-based Shopify storefront, you will be able to render Fast Simon components in your app.

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


## Installation
**To install the package into your project, run:**
```bash
npm install @fast-simon/storefront-kit
```

## Local development
```bash
npm install
```
```bash
npm run dev
```

## Visual Similarity Usage
### Adding Fast Simon fetcher function to the root loader
- import `getVisualSimilarityProducts` from `@fast-simon/storefront-kit` into the product page root file
- Invoke `getVisualSimilarityProducts` in your root loader function, passing the product id as a prop
- Pass down the result to the product page component, you can either await to the promise to resolved (which could have a negative performance impact) or just pass the promise down as a stream.

```js
import {getVisualSimilarityProducts} from '@fast-simon/storefront-kit';

export async function loader({params, request, context}: LoaderFunctionArgs) {
  // ... other code
  const visualSimilarityProducts = getVisualSimilarityProducts({
    UUID: 'Your store UUID here, you can find it in the Fast Simon dashboard',
    productId: product.id,
    storeId: 'Your store ID here, you can find it in the Fast Simon dashboard',
  });
  return defer({otherparam, visualSimilarityProducts});

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
### Adding Fast Simon fetcher function to the root loader
- import `getSmartCollection` from `@fast-simon/storefront-kit` into the collection handle file
- Invoke `getSmartCollection` in your root loader function, passing category URL, uuid and store id as props
- Pass down the results to the collection component.

```js
import {getSmartCollection, transformToShopifyStructure} from '@fast-simon/storefront-kit';

export async function loader({request, params, context}) {
  // ... other code
  const {handle} = params;

  if (!handle) {
    return redirect('/collections');
  }

  const url = new URL(request.url);
  const page = Number(url.searchParams.get("page")) || 1;

  const collection = await getSmartCollection({
    categoryURL: '/collections/' + handle,
    UUID: '3eb6c1d2-152d-4e92-9c29-28eecc232373',
    storeId: '55906173135',
    page: page,
    narrow: [],
    facetsRequired: 1,
    productsPerPage: 30
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
  return json({collection});
}

```
In the above example, we simply translated the Fast Simon results to the form of Shopify GraphQL using `transformToShopifyStructure` in order to use Shopify template components, but this step is optional and not required if you have your own components. 


For any issues, questions, or suggestions, please contact our support team.
