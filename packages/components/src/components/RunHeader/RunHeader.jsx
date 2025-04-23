/*
Copyright 2019-2025 The Tekton Authors
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at
    http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import { useIntl } from 'react-intl';
import { CopyButton, SkeletonPlaceholder } from '@carbon/react';
import { copyToClipboard } from '@tektoncd/dashboard-utils';

import FormattedDate from '../FormattedDate';
import CustomOverflowMenu from '../TagOverflow/TagOverflow';

export default function RunHeader({
  children,
  lastTransitionTime,
  loading,
  message,
  runName,
  reason,
  status,
  triggerHeader,
  runTimeInfo,
  getLabels
}) {
  const intl = useIntl();

  let column;
  if (getLabels) {
    column = (
      <div className="timeContainer">
        <p className="colHeader">Labels</p>
        <CustomOverflowMenu labels={getLabels} />
      </div>
    );
  }

  return (
    <header
      className="tkn--pipeline-run-header"
      data-succeeded={status}
      data-reason={reason}
    >
      {(() => {
        if (loading) {
          return (
            <SkeletonPlaceholder
              className="tkn--header-skeleton"
              title={intl.formatMessage({
                id: 'dashboard.loading',
                defaultMessage: 'Loading…'
              })}
            />
          );
        }
        return (
          runName && (
            <>
              <h1 className="tkn--run-header--heading">
                <div className="tkn--run-name" title={runName}>
                  {runName}
                </div>
              </h1>
              <div className="container">
                {triggerHeader}
                {column}
                {runTimeInfo}
              </div>
            </>
          )
        );
      })()}
    </header>
  );
}
