/*
 * Copyright 2019 Red Hat, Inc. and/or its affiliates.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { alert } from 'store/alert';
import {
  createIdMapFromList, mapWithElement, mapWithoutElement,
  mapWithUpdatedElement,
} from 'util/ImmutableCollectionOperations';
import { onGet, onPost, onDelete } from 'store/rest/RestTestUtils';
import { Spot } from 'domain/Spot';
import { mockStore } from '../mockStore';
import { AppState } from '../types';
import * as actions from './actions';
import reducer, { spotSelectors, spotOperations } from './index';

const state: Partial<AppState> = {
  spotList: {
    isLoading: false,
    spotMapById: new Map([
      [1234, {
        tenantId: 0,
        id: 1234,
        version: 1,
        name: 'Spot 2',
        requiredSkillSet: [1],
      }],
      [2312, {
        tenantId: 0,
        id: 2312,
        version: 0,
        name: 'Spot 3',
        requiredSkillSet: [],
      }],
    ]),
  },
  skillList: {
    isLoading: false,
    skillMapById: new Map([
      [1, {
        tenantId: 0,
        id: 1,
        version: 0,
        name: 'Skill 1',
      }],
    ]),
  },
};

describe('Spot operations', () => {
  it('should dispatch actions and call client on refresh spot list', async () => {
    const { store, client } = mockStore(state);
    const tenantId = store.getState().tenantData.currentTenantId;
    const mockSpotList: Spot[] = [{
      tenantId,
      id: 0,
      version: 0,
      name: 'Spot 1',
      requiredSkillSet: [],
    },
    {
      tenantId,
      id: 1,
      version: 0,
      name: 'Spot 2',
      requiredSkillSet: [{ tenantId, name: 'Skill 1', id: 1, version: 0 }],
    },
    {
      tenantId,
      id: 3,
      version: 0,
      name: 'Spot 3',
      requiredSkillSet: [{ tenantId, name: 'Skill 1', id: 1, version: 0 },
        { tenantId, name: 'Skill 2', id: 2, version: 0 }],
    }];

    onGet(`/tenant/${tenantId}/spot/`, mockSpotList);
    await store.dispatch(spotOperations.refreshSpotList());
    expect(store.getActions()).toEqual([
      actions.setIsSpotListLoading(true),
      actions.refreshSpotList(mockSpotList),
      actions.setIsSpotListLoading(false),
    ]);
    expect(client.get).toHaveBeenCalledTimes(1);
    expect(client.get).toHaveBeenCalledWith(`/tenant/${tenantId}/spot/`);
  });

  it('should dispatch actions and call client on successful delete', async () => {
    const { store, client } = mockStore(state);
    const tenantId = store.getState().tenantData.currentTenantId;

    const spotToDelete: Spot = {
      tenantId,
      id: 0,
      version: 0,
      name: 'Spot 1',
      requiredSkillSet: [],
    };
    onDelete(`/tenant/${tenantId}/spot/${spotToDelete.id}`, true);
    await store.dispatch(spotOperations.removeSpot(spotToDelete));
    expect(store.getActions()).toEqual([
      alert.showSuccessMessage('removeSpot', { name: spotToDelete.name }),
      actions.removeSpot(spotToDelete),
    ]);
    expect(client.delete).toHaveBeenCalledTimes(1);
    expect(client.delete).toHaveBeenCalledWith(`/tenant/${tenantId}/spot/${spotToDelete.id}`);
  });

  it('should not dispatch actions but call client on a failed delete', async () => {
    const { store, client } = mockStore(state);
    const tenantId = store.getState().tenantData.currentTenantId;

    const spotToDelete: Spot = {
      tenantId,
      id: 0,
      version: 0,
      name: 'Spot 1',
      requiredSkillSet: [],
    };

    onDelete(`/tenant/${tenantId}/spot/${spotToDelete.id}`, false);
    await store.dispatch(spotOperations.removeSpot(spotToDelete));
    expect(store.getActions()).toEqual([alert.showErrorMessage('removeSpotError', { name: spotToDelete.name })]);
    expect(client.delete).toHaveBeenCalledTimes(1);
    expect(client.delete).toHaveBeenCalledWith(`/tenant/${tenantId}/spot/${spotToDelete.id}`);
  });

  it('should dispatch actions and call client on add', async () => {
    const { store, client } = mockStore(state);
    const tenantId = store.getState().tenantData.currentTenantId;

    const spotToAdd: Spot = { tenantId, name: 'New Spot', requiredSkillSet: [] };
    const spotWithUpdatedId: Spot = { ...spotToAdd, id: 4, version: 0 };
    onPost(`/tenant/${tenantId}/spot/add`, spotToAdd, spotWithUpdatedId);
    await store.dispatch(spotOperations.addSpot(spotToAdd));
    expect(store.getActions()).toEqual([
      alert.showSuccessMessage('addSpot', { name: spotToAdd.name }),
      actions.addSpot(spotWithUpdatedId),
    ]);
    expect(client.post).toHaveBeenCalledTimes(1);
    expect(client.post).toHaveBeenCalledWith(`/tenant/${tenantId}/spot/add`, spotToAdd);
  });

  it('should dispatch actions and call client on update', async () => {
    const { store, client } = mockStore(state);
    const tenantId = store.getState().tenantData.currentTenantId;

    const spotToUpdate: Spot = {
      tenantId,
      name: 'Updated Spot',
      id: 4,
      version: 0,
      requiredSkillSet: [],
    };
    const spotWithUpdatedVersion: Spot = { ...spotToUpdate, version: 1 };
    onPost(`/tenant/${tenantId}/spot/update`, spotToUpdate, spotWithUpdatedVersion);
    await store.dispatch(spotOperations.updateSpot(spotToUpdate));
    expect(store.getActions()).toEqual([
      alert.showSuccessMessage('updateSpot', { id: spotToUpdate.id }),
      actions.updateSpot(spotWithUpdatedVersion),
    ]);
    expect(client.post).toHaveBeenCalledTimes(1);
    expect(client.post).toHaveBeenCalledWith(`/tenant/${tenantId}/spot/update`, spotToUpdate);
  });
});

describe('Spot reducers', () => {
  const addedSpot: Spot = { tenantId: 0, id: 4321, version: 0, name: 'Spot 1', requiredSkillSet: [] };
  const updatedSpot: Spot = {
    tenantId: 0,
    id: 1234,
    version: 1,
    name: 'Updated Spot 2',
    requiredSkillSet: [],
  };
  const deletedSpot: Spot = {
    tenantId: 0,
    id: 2312,
    version: 0,
    name: 'Spot 3',
    requiredSkillSet: [],
  };
  const { store } = mockStore(state);
  const storeState = store.getState();

  it('set loading', () => {
    expect(
      reducer(storeState.spotList, actions.setIsSpotListLoading(true)),
    ).toEqual({ ...storeState.spotList,
      isLoading: true });
  });
  it('add spot', () => {
    expect(
      reducer(storeState.spotList, actions.addSpot(addedSpot)),
    ).toEqual({ ...storeState.spotList,
      spotMapById: mapWithElement(storeState.spotList.spotMapById, addedSpot) });
  });
  it('remove spot', () => {
    expect(
      reducer(storeState.spotList, actions.removeSpot(deletedSpot)),
    ).toEqual({ ...storeState.spotList,
      spotMapById: mapWithoutElement(storeState.spotList.spotMapById, deletedSpot) });
  });
  it('update spot', () => {
    expect(
      reducer(storeState.spotList, actions.updateSpot(updatedSpot)),
    ).toEqual({ ...storeState.spotList,
      spotMapById: mapWithUpdatedElement(storeState.spotList.spotMapById, updatedSpot) });
  });
  it('refresh spot list', () => {
    expect(
      reducer(storeState.spotList, actions.refreshSpotList([addedSpot])),
    ).toEqual({ ...storeState.spotList,
      spotMapById: createIdMapFromList([addedSpot]) });
  });
});

describe('Spot selectors', () => {
  const { store } = mockStore(state);
  const storeState = store.getState();

  it('should throw an error if Spot list or Skill is loading', () => {
    expect(() => spotSelectors.getSpotById({
      ...storeState,
      skillList: { ...storeState.skillList, isLoading: true },
    }, 1234)).toThrow();
    expect(() => spotSelectors.getSpotById({
      ...storeState,
      spotList: { ...storeState.spotList, isLoading: true },
    }, 1234)).toThrow();
  });

  it('should get a spot by id', () => {
    const spot = spotSelectors.getSpotById(storeState, 1234);
    expect(spot).toEqual({
      tenantId: 0,
      id: 1234,
      version: 1,
      name: 'Spot 2',
      requiredSkillSet: [
        {
          tenantId: 0,
          id: 1,
          version: 0,
          name: 'Skill 1',
        },
      ],
    });
  });

  it('should return an empty list if spot list or skill list is loading', () => {
    let spotList = spotSelectors.getSpotList({
      ...storeState,
      skillList: { ...storeState.skillList, isLoading: true },
    });
    expect(spotList).toEqual([]);
    spotList = spotSelectors.getSpotList({
      ...storeState,
      spotList: { ...storeState.spotList, isLoading: true },
    });
    expect(spotList).toEqual([]);
  });

  it('should return a list of all spots', () => {
    const spotList = spotSelectors.getSpotList(storeState);
    expect(spotList).toEqual(expect.arrayContaining([
      {
        tenantId: 0,
        id: 1234,
        version: 1,
        name: 'Spot 2',
        requiredSkillSet: [
          {
            tenantId: 0,
            id: 1,
            version: 0,
            name: 'Skill 1',
          },
        ],
      },
      {
        tenantId: 0,
        id: 2312,
        version: 0,
        name: 'Spot 3',
        requiredSkillSet: [],
      },
    ]));
    expect(spotList.length).toEqual(2);
  });
});
