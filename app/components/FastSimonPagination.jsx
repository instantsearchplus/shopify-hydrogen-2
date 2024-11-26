import {Link, useSearchParams} from '@remix-run/react';
import React from 'react';

function setSearchParamsString(searchParams, changes) {
  const newSearchParams = new URLSearchParams(searchParams);
  for (const [key, value] of Object.entries(changes)) {
    if (value === undefined) {
      newSearchParams.delete(key);
      continue;
    }
    newSearchParams.set(key, String(value));
  }

  return newSearchParams.toString();
}

export function PaginationBar(total) {
  const [searchParams] = useSearchParams();
  const currentPage = Number(searchParams.get('page')) || 1;
  const totalPages = total.total;
  const pageNumbers = [...Array.from(Array(totalPages).keys())].map(i => i+1);

  return (
    <div className={'pagination-wrapper'}>
      {currentPage > 1 ? (
          <Link
            to={{
              search: setSearchParamsString(searchParams, {
                page: Math.max(currentPage - 1, 0),
              }),
            }}
            preventScrollReset
            prefetch="intent"
            className="arrow-button-wrapper arrow-button"
          >
            <span className="sr-only"> {'<'}</span>
            {/*<Icon name="arrow-right" />*/}
          </Link>
      ) : null}
      <span className={'center-pages-wrapper'}>
        {pageNumbers.map((pageNumber) => {
          if (pageNumber === 2 && currentPage > 4) {
            return (
              <span
                key={`three-dots-left`}
                className={'page-number-item three-dots-item'}
              >
                ...
              </span>
            );
          }
          if (pageNumber === currentPage) {
            return (
              <Link
                key={`page_num_${pageNumber}_current`}
                to={{
                  search: setSearchParamsString(searchParams, {
                    page: pageNumber,
                  }),
                }}
                preventScrollReset
                prefetch="intent"
                className="page-number-item page-number-item-selected"
              >
                <span className="sr-only"> {pageNumber}</span>
                {/*<Icon name="arrow-right" />*/}
              </Link>
            );
          } else if (
            pageNumber === currentPage + 1 ||
            pageNumber === currentPage + 2 ||
            pageNumber === currentPage - 1 ||
            pageNumber === currentPage - 2 ||
            pageNumber === totalPages ||
            pageNumber === 1
          ) {
            return (
              <Link
                key={`page_num_${pageNumber}`}
                to={{
                  search: setSearchParamsString(searchParams, {
                    page: Math.max(pageNumber, 0),
                  }),
                }}
                preventScrollReset
                prefetch="intent"
                className="page-number-item"
              >
                <span className="sr-only"> {pageNumber}</span>
                {/*<Icon name="arrow-right" />*/}
              </Link>
            );
          }
          if (currentPage < totalPages - 3 && pageNumber === totalPages - 1) {
            return (
              <span
                key={`three-dots-right`}
                className={'page-number-item three-dots-item'}
              >
                ...
              </span>
            );
          }
          return null;
        })}
      </span>
      {currentPage < totalPages ? (
        <Link
          to={{
            search: setSearchParamsString(searchParams, {
              page: Math.max(currentPage + 1, 0),
            }),
          }}
          preventScrollReset
          prefetch="intent"
          className="arrow-button-wrapper"
        >
          <span className="sr-only arrow-button">{'>'}</span>
          {/*<Icon name="arrow-right" />*/}
        </Link>

      ) : null}
    </div>
  );
}
