import React, {useEffect, useRef} from 'react';
import {Link, useSearchParams} from '@remix-run/react';
import {sortByTextToServerDict} from '~/components/SortByContainer';
import {setSearchParamsString} from '@fast-simon/storefront-kit';

interface Props {
  currentSort: string;
  sortOptions: {active: boolean, name: string, id: number | string}[];
  isOpen: boolean;
  closeMenu: () => void;
}

export function SortByMenu({currentSort, sortOptions, isOpen, closeMenu}: Props) {
  const [searchParams] = useSearchParams();

  const onClickOutside = (event) => {
    if(!event.target.classList.contains('fs-sort-button') && !event.target.closest('.fs-sort-button')) {
      closeMenu();
    }
  }

  const containerRef = useClickOutside<HTMLDivElement>(onClickOutside);

  const activeSortingOptions = sortOptions.filter(option => option.active).map(option => ({
    text: option.name,
    id: option.id,
    serverName: sortByTextToServerDict[option.name],
    isActive: currentSort === sortByTextToServerDict[option.name]
  }));

  if(!isOpen) {
    return null;
  }

  return (
    <div className={'sort-by-menu-container'} ref={containerRef}>
      <div className={'sort-by-menu'} >
        {activeSortingOptions.map(option => (
          <Link
            to={{
              search: setSearchParamsString(searchParams, {
                sort: option.serverName,
                page: '1'
              }),
            }}
            preventScrollReset
            prefetch="intent"
            className="fs-sort-option"
            key={option.id}
            onClick={closeMenu}
          >
            {option.text}
          </Link>
        ))}
      </div>
    </div>
  )

}

function useClickOutside(callback) {
  const callbackRef = useRef();
  const innerRef = useRef(null);

  useEffect(() => { callbackRef.current = callback; });

  useEffect(() => {
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
    function handleClick(e) {
      if (innerRef.current && callbackRef.current &&
        !innerRef.current.contains(e.target)
      ) callbackRef.current(e);
    }
  }, []);

  return innerRef;
}