import React from 'react';

interface Props {
    pageTitle: string;
    numberOfResults: number;
}

export function ResultsSummary({pageTitle, numberOfResults}: Props) {

    return (
      <div className={'fs-summary'}>
          <div className={'fs-page-name'}>{pageTitle}</div>
          <div className={'fs-total-results'}>{numberOfResults} Results</div>
      </div>
    )

}