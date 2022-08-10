/* eslint-disable camelcase */

import {first} from 'rxjs/operators'
import {SanityClient} from '@sanity/client'
import {prepareTemplates, defaultTemplatesForSchema} from '../../../templates'
import {createMockSanityClient} from '../../../../test/mocks/mockSanityClient'
import {createSchema} from '../../../schema'
import {requiresApproval} from '../debug/exampleGrants'
import {createGrantsStore} from '../grantsStore'
import {getTemplatePermissions} from '../templatePermissions'

const schema = createSchema({
  name: 'test',
  types: [
    {
      name: 'author',
      title: 'Author',
      type: 'document',
      fields: [
        {name: 'name', type: 'string'},
        {name: 'role', type: 'string'},
        {name: 'locked', type: 'boolean'},
      ],
    },
  ],
})

const templates = prepareTemplates(schema, [
  ...defaultTemplatesForSchema(schema),
  {
    id: 'author-developer-locked',
    title: 'Developer',
    schemaType: 'author',
    value: {role: 'developer', locked: true},
  },
  {
    id: 'author-developer-unlocked',
    title: 'Developer',
    schemaType: 'author',
    value: {role: 'developer', locked: false},
  },
])

describe('getTemplatePermissions', () => {
  it('takes in a list of `InitialValueTemplateItem`s and returns an observable of `TemplatePermissionsResult` in a record', async () => {
    const client = createMockSanityClient({requests: {'/acl': requiresApproval}})
    const grantsStore = createGrantsStore({
      client: client as unknown as SanityClient,
      currentUser: null,
    })

    const permissions = getTemplatePermissions({
      grantsStore,
      schema,
      templates,
      templateItems: [
        {
          id: 'author-developer-locked',
          templateId: 'author-developer-locked',
          type: 'initialValueTemplateItem',
          schemaType: 'author',
        },
        {
          id: 'author-developer-unlocked',
          templateId: 'author-developer-unlocked',
          type: 'initialValueTemplateItem',
          schemaType: 'author',
        },
      ],
    })
      .pipe(first())
      .toPromise()

    await expect(permissions).resolves.toEqual([
      {
        description: undefined,
        granted: false,
        icon: undefined,
        id: 'author-developer-locked',
        parameters: undefined,
        reason: 'No matching grants found',
        resolvedInitialValue: {locked: true, role: 'developer'},
        subtitle: 'Author',
        template: {
          description: undefined,
          icon: undefined,
          id: 'author-developer-locked',
          parameters: undefined,
          schemaType: 'author',
          title: 'Developer',
          value: {locked: true, role: 'developer'},
        },
        templateId: 'author-developer-locked',
        title: 'Developer',
        type: 'initialValueTemplateItem',
      },
      {
        description: undefined,
        granted: true,
        icon: undefined,
        id: 'author-developer-unlocked',
        parameters: undefined,
        reason: 'Matching grant',
        resolvedInitialValue: {locked: false, role: 'developer'},
        subtitle: 'Author',
        template: {
          description: undefined,
          icon: undefined,
          id: 'author-developer-unlocked',
          parameters: undefined,
          schemaType: 'author',
          title: 'Developer',
          value: {locked: false, role: 'developer'},
        },
        templateId: 'author-developer-unlocked',
        title: 'Developer',
        type: 'initialValueTemplateItem',
      },
    ])
  })
})