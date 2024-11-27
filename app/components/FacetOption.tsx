import React, {useEffect, useState} from 'react';
import {Narrow} from '@fast-simon/utilities';
import {ServerFacet} from '~/components/Filters';
import {Link, useNavigate, useSearchParams} from '@remix-run/react';

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

interface Props {
    facet: ServerFacet;
    option: any;
    narrowString?: string
}

export function FacetOption({facet, option, narrowString}: Props) {
    const [narrow, setNarrow] = useState(Narrow.parseNarrow(narrowString || ''));
    const [isChecked, setIsChecked] = useState(narrow ? Narrow.isInNarrow(narrow, facet[2], option[0]) : false);
    const [searchParams] = useSearchParams();

    useEffect(() => {
        const newNarrow = Narrow.parseNarrow(narrowString || '');
        setNarrow(newNarrow);
        setIsChecked(Narrow.isInNarrow(newNarrow, facet[2], option[0]));
    }, [narrowString]);

    const getNarrowParam = () => {
        let newNarrow = Narrow.updateNarrow(narrow || {}, facet[2], option[0]);
        return Narrow.dumpNarrow(newNarrow);
    }

    const narrowClicked = () => {
      setIsChecked(!isChecked);
    }

    return (
      <div className={`fs-facet-option${false ? ' fs-facet-option-disable' : ''}`}>
          <Link
            to={{
                search: setSearchParamsString(searchParams, {
                    filters: getNarrowParam(),
                    page: '1'
                }),
            }}
            preventScrollReset
            prefetch="intent"
            className="fs-facet-option"
            onClick={narrowClicked}
          >
            <span className={'fs-checkbox' + (isChecked ? ' fs-selected-checkbox' : '')}>

                <input type="checkbox"/>

                <span className={"checkmark" + (isChecked ? ' fs-selected-checkmark' : '')}/>

                <span>{facet[2] === 'Categories' ? option[2] : option[0]}</span>
            </span>
              <span>({option[1]})</span>
          </Link>
      </div>

    )
}