import {json, redirect} from '@shopify/remix-oxygen';
import {useLoaderData, Link} from '@remix-run/react';
import {
  getPaginationVariables,
  Image,
  Money,
} from '@shopify/hydrogen';
import {useVariantUrl} from '~/utils';
import {getSmartCollection, transformToShopifyStructure} from '@fast-simon/storefront-kit';
import {PaginationBar} from '~/components/FastSimonPagination';

/**
 * @type {MetaFunction<typeof loader>}
 */
export const meta = ({data}) => {
  return [{title: `Hydrogen | ${data?.collection.title ?? ''} Collection`}];
};

/**
 * @param {LoaderFunctionArgs}
 */
export async function loader({request, params, context}) {
  const {handle} = params;
  const {storefront} = context;

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

export default function Collection() {
  /** @type {LoaderReturnData} */
  const {collection} = useLoaderData();

  return (
    <div className="collection">
      <h1>{collection.title}</h1>
      <p className="collection-description">{collection.description}</p>
      <ProductsGrid products={collection.products.nodes} />
      <br />
      <PaginationBar total={collection.total_p} />
    </div>
  );
}

/**
 * @param {{products: ProductItemFragment[]}}
 */
function ProductsGrid({products}) {
  return (
    <div className="products-grid">
      {products.map((product, index) => {
        return (
          <ProductItem
            key={product.id}
            product={product}
            loading={index < 8 ? 'eager' : undefined}
          />
        );
      })}
    </div>
  );
}

/**
 * @param {{
 *   product: ProductItemFragment;
 *   loading?: 'eager' | 'lazy';
 * }}
 */
function ProductItem({product, loading}) {
  const variant = product.variants.nodes[0];
  const variantUrl = useVariantUrl(product.handle, variant.selectedOptions).replace('?=', '');
  return (
    <Link
      className="product-item"
      key={product.id}
      prefetch="intent"
      to={variantUrl}
    >
      {product.featuredImage && (
        <Image
          alt={product.featuredImage.altText || product.title}
          aspectRatio="0.8"
          data={product.featuredImage}
          loading={loading}
          sizes="(min-width: 45em) 400px, 100vw"
          height={'100'}
        />
      )}
      <h4>{product.title}</h4>
      <small>
        <Money data={product.priceRange.minVariantPrice} />
      </small>
    </Link>
  );
}

const PRODUCT_ITEM_FRAGMENT = `#graphql
  fragment MoneyProductItem on MoneyV2 {
    amount
    currencyCode
  }
  fragment ProductItem on Product {
    id
    handle
    title
    featuredImage {
      id
      altText
      url
      width
      height
    }
    priceRange {
      minVariantPrice {
        ...MoneyProductItem
      }
      maxVariantPrice {
        ...MoneyProductItem
      }
    }
    variants(first: 1) {
      nodes {
        selectedOptions {
          name
          value
        }
      }
    }
  }
`;

// NOTE: https://shopify.dev/docs/api/storefront/2022-04/objects/collection
const COLLECTION_QUERY = `#graphql
  ${PRODUCT_ITEM_FRAGMENT}
  query Collection(
    $handle: String!
    $country: CountryCode
    $language: LanguageCode
    $first: Int
    $last: Int
    $startCursor: String
    $endCursor: String
  ) @inContext(country: $country, language: $language) {
    collection(handle: $handle) {
      id
      handle
      title
      description
      products(
        first: $first,
        last: $last,
        before: $startCursor,
        after: $endCursor
      ) {
        nodes {
          ...ProductItem
        }
        pageInfo {
          hasPreviousPage
          hasNextPage
          endCursor
          startCursor
        }
      }
    }
  }
`;

/** @typedef {import('@shopify/remix-oxygen').LoaderFunctionArgs} LoaderFunctionArgs */
/** @template T @typedef {import('@remix-run/react').MetaFunction<T>} MetaFunction */
/** @typedef {import('storefrontapi.generated').ProductItemFragment} ProductItemFragment */
/** @typedef {import('@shopify/remix-oxygen').SerializeFrom<typeof loader>} LoaderReturnData */
