import React, {Suspense} from 'react';
import {FacetOption} from '~/components/FacetOption';
import {Await, useSearchParams} from '@remix-run/react';

export type ServerFacet = [string, FacetServerValue[], string, boolean, number] // [id, values, name, ?? ,??]
export type FacetServerValue = GeneralFacetServerValue | CategoryServerFacetValue | ColorFamilyFacetServerValue
export type GeneralFacetServerValue = [string, number] // [name, count]
export type CategoryServerFacetValue = [string, number, string, string] // [category_id, count, category_name, category_url]
export type ColorFamilyFacetServerValue = [string, number, string] // [name, count, hex_value]

export enum SpecialFacetID {
    Category = "Categories",
    OnSale = "Isp-on-sale",
    Price = 'Price',
    PriceRange = 'Price_from_to',
    PriceMax = 'Price_max',
    PriceMin = 'Price_min',
    InStock = "Isp-in-stock",
    Color = 'Color',
    ColorFamily = 'Isp-color-family',
    Rating = 'Isp-review-stars'
}

export type FilterID = SpecialFacetID | string

export type Facet = {
    id: FilterID
    name: string
    values: FacetValue[]
    meta?: Record<string, string | number | boolean>
}


export interface FacetValue {
    name: string,
    displayName: string
    count: number,
    meta?: Record<string, string | number | boolean>
}

export interface PriceRange {
    min: number;
    max: number;
}

export const SWITCH_FACETS = new Set<SpecialFacetID>([SpecialFacetID.InStock, SpecialFacetID.OnSale])
export const NONE_SEARCHABLE_FACETS = new Set<SpecialFacetID>([SpecialFacetID.InStock, SpecialFacetID.OnSale, SpecialFacetID.Price, SpecialFacetID.Rating])
export const COLOR_FACETS = new Set<string>([SpecialFacetID.Color.toLowerCase(), SpecialFacetID.ColorFamily.toLowerCase(), 'colour', 'cor', 'couleur', 'farbe', 'box color'])
interface Props {
    facets: Promise<ServerFacet[]>;
}

export function Filters({facets}: Props) {
    const [searchParams] = useSearchParams();
    const narrowString = searchParams.has('filters') ? searchParams.get('filters') : '';

    return (
      <Suspense fallback={<div></div> }>
          <div className={'fs-filters'}>
              <Await resolve={facets}>
                  {(resolved) =>
                    { return resolved.map(facet => {
                            if(facet[2].toLowerCase().includes('price'))
                                return null;
                            return (
                              <div key={'facet_container'+"_"+facet[2]} className={'fs-facet-container'}>
                                  <div className={'fs-facet-title'}>
                                      {facet[2]}
                                  </div>
                                  <div className={'fs-facet-options'}>
                                      {facet[1].map(option => <FacetOption key={`facet_option_${facet[2]}_${option[0]}`} option={option} facet={facet} narrowString={narrowString}/>)}
                                  </div>
                              </div>
                            )
                        })}
                  }
              </Await>
          </div>
      </Suspense>
    )

}