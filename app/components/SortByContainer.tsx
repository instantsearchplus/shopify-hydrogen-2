import React, {Suspense, useState} from 'react';
import {Await, useSearchParams} from '@remix-run/react';
import {SortByMenu} from '~/components/SortByMenu';

export const sortByServerToTextDict = {
  'relevency': 'Best Match',
  'relevance': 'Best Match',
  'price_min_to_max': 'Price: Low to High',
  'price_max_to_min': 'Price: High to Low',
  'creation_date': 'Newest Arrivals',
  'creation_date_oldest': 'Oldest Products',
  'popularity': 'Popularity',
  'reviews': 'Customer Rating',
  'a_to_z': 'Alphabetical: A-Z',
  'z_to_a': 'Alphabetical: Z-A'
}
export const sortByTextToServerDict = {
  'Best Match': 'relevance',
  'Price: Low to High': 'price_min_to_max',
  'Price: High to Low': 'price_max_to_min',
  'Newest Arrivals': 'creation_date',
  'Oldest Products': 'creation_date_oldest',
  'Popularity': 'popularity',
  'Customer Rating': 'reviews',
  'Alphabetical: A-Z': 'a_to_z',
  'Alphabetical: Z-A': 'z_to_a'
}

interface Props {
  serverSort: string;
  dashboardConfig: Promise<any>;
}

export function SortByContainer({serverSort, dashboardConfig}: Props) {
  const [searchParams] = useSearchParams();
  const sortParam = searchParams.has('sort') ? searchParams.get('sort') : '';
  const [isOpen, setIsOpen] = useState(false);

  const onSortByClick = () => {
    setIsOpen(!isOpen);
  }

  const closeMenu = () => {
    setIsOpen(false);
  }

  return (
    <Suspense fallback={<div></div> }>
      <div className={'fs-sort-btn-and-menu-container'}>
        <div className={'fs-sort-container'} onClick={onSortByClick}>
          <div className={'fs-sort-button'}>
            {sortParam ? sortByServerToTextDict[sortParam] : serverSort ? sortByServerToTextDict[serverSort] : 'SORT'}
            <div className={'arrow-down'} style={{transform: 'scaleY(0.7)'}}><div style={{transform: !isOpen ? 'rotate(0deg)' : 'rotate(180deg)', transition: "transform 200ms ease-in-out"}}>&#x2BC6;</div></div>

          </div>
        </div>

        <Await resolve={dashboardConfig}>
          {(resolvedConfig) => (<SortByMenu currentSort={sortParam | serverSort} sortOptions={resolvedConfig.sort} isOpen={isOpen} closeMenu={closeMenu}/>)}
        </Await>
      </div>

    </Suspense>
  )

}