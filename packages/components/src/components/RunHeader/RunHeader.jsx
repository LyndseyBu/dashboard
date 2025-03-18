/*
Copyright 2019-2024 The Tekton Authors
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
import { useRef } from 'react';
import { useIntl } from 'react-intl';
import {
  Column,
  CopyButton,
  FlexGrid,
  Row,
  SkeletonPlaceholder,
  Tag
} from '@carbon/react';
import { ExpressiveCard, TagSet } from '@carbon/ibm-products';
import { copyToClipboard } from '@tektoncd/dashboard-utils';
import { TYPES as tagTypes } from '@carbon/react/es/components/Tag/Tag';
import FormattedDate from '../FormattedDate';

export default function RunHeader({
  children,
  icon,
  lastTransitionTime,
  loading,
  message,
  runName,
  reason,
  status,
  triggerHeader,
  workerInfo,
  getRunTriggerInfo,
  getLabels,
  getRunTimeInfo
}) {
  const intl = useIntl();
  const containerRef = useRef(null);
  /* istanbul ignore next */
  function copyStatusMessage() {
    copyToClipboard(message);
  }

  const { completed, started } = getRunTimeInfo();
  const { eventListener, trigger } = getRunTriggerInfo();

  const labels = getLabels();
  let showTags;
  if (labels) {
    const labels1 = Object.entries(labels).map(([key, value]) => ({
      type: tagTypes[tagTypes.length],
      label: `${key}: ${value}`
    }));
    showTags = {
      label: 'Labels',
      children: (
        <div id="testing" className="container" ref={containerRef}>
          <TagSet
            containingElementRef={containerRef}
            tags={labels1}
            maxVisible={2}
            allTagsModalSearchLabel="Filter tags"
            allTagsModalTile="All tags"
            allTagsModalSearchPlaceholderText="Filter tags"
            showAllTagsLabel="Show all tags"
            size="sm"
            multiline
            measurementOffset={4}
            overflowAutoAlign={false}
          />
        </div>
      )
    };
  }
  const displayWorkerInfo = {
    label: 'Worker',
    children: <div>{workerInfo}</div>
  };

  const triggerInfo = {
    label: 'Triggered by',
    children: (
      <>
        <div>{eventListener}</div>
        <div>{trigger}</div>
      </>
    )
  };

  const timeInfo = {
    label: 'Time',
    children: (
      <>
        <div>
          Started:
          <FormattedDate date={started} />
        </div>
        <div>
          Completed:
          <FormattedDate date={completed} />
        </div>
      </>
    )
  };

  return (
    <>
      <h1 className="tkn--run-header--heading actions button">{children}</h1>
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
                {/* <h1 className="tkn--run-header--heading actions button">
                {children}
              </h1> */}

                <FlexGrid fullWidth>
                  <Row>
                    <Column>
                      <ExpressiveCard {...triggerInfo} />
                    </Column>
                    {labels && (
                      <Column>
                        <ExpressiveCard {...showTags} />
                      </Column>
                    )}
                    <Column>
                      <ExpressiveCard {...timeInfo} />
                    </Column>
                    {workerInfo && (
                      <Column>
                        <ExpressiveCard {...displayWorkerInfo} />
                      </Column>
                    )}
                  </Row>
                </FlexGrid>
                {triggerHeader}
              </>
            )
          );
        })()}
      </header>
    </>
  );
}
