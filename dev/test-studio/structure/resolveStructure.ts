import {
  EarthGlobeIcon,
  ImagesIcon,
  PlugIcon,
  RocketIcon,
  SyncIcon,
  TerminalIcon,
  UsersIcon,
} from '@sanity/icons'
import {uuid} from '@sanity/uuid'
import {StructureResolver} from '@sanity/base'
import {DebugPane} from '../components/panes/debug'
import {JsonDocumentDump} from '../components/panes/JsonDocumentDump'
import {_buildTypeGroup} from './_buildTypeGroup'
import {
  CI_INPUT_TYPES,
  DEBUG_INPUT_TYPES,
  EXTERNAL_PLUGIN_INPUT_TYPES,
  DEBUG_FIELD_GROUP_TYPES,
  PLUGIN_INPUT_TYPES,
  STANDARD_INPUT_TYPES,
  STANDARD_PORTABLE_TEXT_INPUT_TYPES,
} from './constants'
import {delayValue} from './_helpers'

export const structure: StructureResolver = (S, {schema}) => {
  return S.list()
    .title('Content')
    .items([
      S.listItem()
        .title('Untitled repro')
        .child(
          S.list()
            .title('Untitled repro')
            .items([S.documentListItem().id('grrm').schemaType('author')])
        ),

      _buildTypeGroup(S, schema, {
        icon: TerminalIcon,
        id: 'input-debug',
        title: 'Debug inputs',
        types: DEBUG_INPUT_TYPES,
        groups: [
          {
            id: 'field-groups',
            title: 'Field groups',
            types: DEBUG_FIELD_GROUP_TYPES,
          },
        ],
      }),

      S.divider(),

      _buildTypeGroup(S, schema, {
        id: 'input-standard',
        title: 'Standard inputs',
        types: STANDARD_INPUT_TYPES,
        groups: [
          {
            id: 'portable-text',
            title: 'Portable Text',
            types: STANDARD_PORTABLE_TEXT_INPUT_TYPES,
          },
        ],
      }),
      _buildTypeGroup(S, schema, {
        icon: PlugIcon,
        id: 'input-plugin',
        title: 'Plugin inputs',
        types: PLUGIN_INPUT_TYPES,
      }),
      _buildTypeGroup(S, schema, {
        icon: EarthGlobeIcon,
        id: 'input-external-plugin',
        title: 'External plugin inputs',
        types: EXTERNAL_PLUGIN_INPUT_TYPES,
      }),

      S.divider(),

      S.listItem()
        .id('custom')
        .title('Custom panes')
        .child(
          S.list()
            .id('custom')
            .title('Custom panes')
            .items([
              S.listItem()
                .id('component1')
                .title('Component pane (1)')
                .child(
                  Object.assign(
                    S.component(DebugPane)
                      .id('component1')
                      .title('Component pane #1')
                      .options({no: 1})
                      .menuItems([
                        S.menuItem()
                          .title('From Menu Item Create Intent')
                          .intent({
                            type: 'create',
                            params: {type: 'author', id: `special.${uuid()}`},
                          }),
                        S.menuItem()
                          .title('Also Menu Item Create Intent')
                          .intent({
                            type: 'create',
                            params: {type: 'author', id: uuid()},
                          }),
                        S.menuItem()
                          .title('Test 1')
                          // eslint-disable-next-line no-alert
                          .action(() => alert('you clicked!'))
                          .showAsAction(true),
                        S.menuItem()
                          .title('Test Edit Intent (as action)')
                          .intent({
                            type: 'edit',
                            params: {id: 'grrm', type: 'author'},
                          })
                          .icon(RocketIcon)
                          .showAsAction(),
                        S.menuItem().title('Should warn in console').action('shouldWarn'),
                        S.menuItem()
                          .title('Test Edit Intent (in menu)')
                          .intent({
                            type: 'edit',
                            params: {id: 'foo-bar', type: 'author'},
                          }),
                      ])
                      .child(
                        S.component(DebugPane)
                          .id('component1-1')
                          .title('Component pane #1.1')
                          .options({no: 1})
                          .menuItems([
                            S.menuItem().title('Test 1').action('test-1').showAsAction(true),
                            S.menuItem().title('Test 2').action('test-2'), //.showAsAction(true),
                          ])
                          .child(S.document().documentId('component1-1-child').schemaType('author'))
                      )
                      .serialize(),
                    {__preserveInstance: true}
                  )
                ),

              S.listItem()
                .id('component2')
                .title('Component pane (2)')
                .child(
                  S.component(DebugPane)
                    .id('component2')
                    .title('Component pane #2')
                    .options({no: 2})
                    .menuItems([S.menuItem().title('Test 1').action('test-1').showAsAction(true)])
                    .child(S.document().documentId('component2-child').schemaType('author'))
                ),

              S.divider(),

              // A "singleton" using a document node with no schema type
              // This is deprecated and scheduled for removal
              S.documentListItem()
                .id('foo-bar')
                .title('Singleton author')
                .schemaType('author')
                .child(S.document().documentId('foo-bar')),

              S.divider(),

              S.listItem()
                .title('Anything with a title')
                // .icon(() => <span data-sanity-icon>T</span>)
                .child(() =>
                  delayValue(
                    S.documentList({
                      id: 'title-list',
                      title: 'Titles!',
                      options: {
                        filter: 'defined(title)',
                      },
                    })
                  )
                ),

              // A singleton not using `documentListItem`, eg no built-in preview
              S.listItem()
                .title('Singleton?')
                .child(
                  delayValue(
                    S.editor({
                      id: 'editor',
                      options: {id: 'circular', type: 'referenceTest'},
                    }).title('Specific title!')
                  ) as any
                )
                .showIcon(false),

              // A "singleton" which overrides the title, and provides a custom child
              S.documentListItem()
                .id('grrm')
                .title('GRRM')
                .schemaType('author')
                .child(
                  S.component(JsonDocumentDump)
                    .id('json-dump')
                    .title('GRRM')
                    .options({pass: 'through'})
                    .menuItems([
                      S.menuItem()
                        .title('Reload')
                        .action('reload')
                        .icon(SyncIcon)
                        .showAsAction(true),
                    ])
                ),

              // A "singleton" which should use a default preview
              S.documentListItem().id('jrr-tolkien').schemaType('author'),

              S.listItem()
                .title('Deep')
                .child(
                  S.list()
                    .title('Deeper')
                    .items([
                      S.documentTypeListItem('book').title('Books'),
                      S.documentTypeListItem('author').title('Authors'),
                    ])
                ),
              S.listItem()
                .title('Deep panes')
                .child(
                  S.list()
                    .title('Depth 1')
                    .items([
                      S.listItem()
                        .title('Deeper')
                        .child(
                          S.list()
                            .title('Depth 2')
                            .items([
                              S.listItem()
                                .title('Even deeper')
                                .child(
                                  S.list()
                                    .title('Depth 3')
                                    .items([
                                      S.listItem()
                                        .title('Keep digging')
                                        .child(
                                          S.list()
                                            .title('Depth 4')
                                            .items([
                                              S.listItem()
                                                .title('Dig into the core of the earth')
                                                .child(
                                                  S.list()
                                                    .title('Depth 5')
                                                    .items([
                                                      S.documentListItem()
                                                        .id('grrm')
                                                        .schemaType('author'),
                                                    ])
                                                ),
                                            ])
                                        ),
                                    ])
                                ),
                            ])
                        ),
                    ])
                ),

              S.listItem({
                id: 'developers',
                icon: UsersIcon,
                title: 'Developers',
                schemaType: 'author',
                child: () =>
                  S.documentTypeList('author')
                    .title('Developers')
                    .filter('_type == $type && role == $role')
                    .params({type: 'author', role: 'developer'})
                    .initialValueTemplates(S.initialValueTemplateItem('author-developer')),
              }),

              S.listItem({
                id: 'books-by-author',
                title: 'Books by author',
                schemaType: 'book',
                child: () =>
                  S.documentTypeList('author').child((authorId) =>
                    S.documentTypeList('book')
                      .title('Books by author')
                      .filter('_type == $type && author._ref == $authorId')
                      .params({type: 'book', authorId})
                      .initialValueTemplates([
                        S.initialValueTemplateItem('book-by-author', {authorId}),
                      ])
                  ),
              }),

              S.divider(),

              S.listItem()
                .title('Custom books list')
                .child(
                  S.documentList()
                    .title('Unspecified books list')
                    .menuItems(S.documentTypeList('book').getMenuItems())
                    .filter('_type == $type')
                    .params({type: 'book'})
                ),

              S.divider(),

              S.documentTypeListItem('sanity.imageAsset').title('Images').icon(ImagesIcon),
            ])
        ),

      S.listItem().icon(PlugIcon).id('plugin').title('Plugin panes').child(
        S.list().id('plugin').title('Plugin panes').items([
          // orderableDocumentListDeskItem({
          //   type: 'orderableCategory',
          //   icon: TagIcon,
          //   title: 'Category (orderable)',
          // }),
          // orderableDocumentListDeskItem({
          //   type: 'orderableTag',
          //   icon: TagIcon,
          //   title: 'Tag (orderable)',
          // }),
        ])
      ),

      S.divider(),

      _buildTypeGroup(S, schema, {
        icon: SyncIcon,
        id: 'input-ci',
        title: 'CI',
        types: CI_INPUT_TYPES,
      }),

      S.divider(),

      ...S.documentTypeListItems().filter((listItem) => {
        const id = listItem.getId()

        return (
          id &&
          !CI_INPUT_TYPES.includes(id) &&
          !DEBUG_INPUT_TYPES.includes(id) &&
          !STANDARD_INPUT_TYPES.includes(id) &&
          !STANDARD_PORTABLE_TEXT_INPUT_TYPES.includes(id) &&
          !PLUGIN_INPUT_TYPES.includes(id) &&
          !EXTERNAL_PLUGIN_INPUT_TYPES.includes(id) &&
          !DEBUG_FIELD_GROUP_TYPES.includes(id)
        )
      }),
    ])
}