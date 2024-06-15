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

import { deleteRequest } from './comms';
import {
  getKubeAPI,
  tektonAPIGroup,
  useCollection,
  useResource
} from './utils';

export function deleteClusterTask({ name }) {
  const uri = getKubeAPI({
    group: tektonAPIGroup,
    kind: 'clustertasks',
    params: { name },
    version: 'v1beta1'
  });
  return deleteRequest(uri);
}

export function useClusterTasks(params) {
  return useCollection({
    group: tektonAPIGroup,
    kind: 'clustertasks',
    params,
    version: 'v1beta1'
  });
}

export function useClusterTask(params, queryConfig) {
  return useResource({
    group: tektonAPIGroup,
    kind: 'clustertasks',
    params,
    queryConfig,
    version: 'v1beta1'
  });
}
