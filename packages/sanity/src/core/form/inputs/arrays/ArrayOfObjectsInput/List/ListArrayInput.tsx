/* eslint-disable react/jsx-handler-names */
import {Card, Stack, Text} from '@sanity/ui'
import React, {useCallback} from 'react'
import {UploaderResolver} from '../../../../studio/uploads/types'
import {Item, List} from '../../common/list'
import {ArrayOfObjectsInputProps, ObjectItem, UploadEvent} from '../../../../types'
import {DefaultArrayInputFunctions} from '../../common/ArrayFunctions'
import {ArrayOfObjectsItem} from '../../../../members'

import {createProtoArrayValue} from '../createProtoArrayValue'
import {UploadTargetCard} from '../../common/UploadTargetCard'
import {ErrorItem} from './ErrorItem'

export interface ArrayInputProps<Item extends ObjectItem> extends ArrayOfObjectsInputProps<Item> {
  resolveUploader: UploaderResolver
  onUpload: (event: UploadEvent) => void
}

export function ListArrayInput<Item extends ObjectItem>(props: ArrayInputProps<Item>) {
  const {
    schemaType,
    onChange,
    value = [],
    readOnly,
    members,
    elementProps,
    resolveUploader,
    onInsert,
    onItemMove,
    onUpload,
    renderPreview,
    renderField,
    renderItem,
    renderInput,
  } = props

  const handlePrepend = useCallback(
    (item: Item) => {
      onInsert({items: [item], position: 'before', referenceItem: 0})
    },
    [onInsert]
  )

  const handleAppend = useCallback(
    (item: Item) => {
      onInsert({items: [item], position: 'after', referenceItem: -1})
    },
    [onInsert]
  )

  const sortable = schemaType.options?.sortable !== false

  return (
    <Stack space={3}>
      <UploadTargetCard
        types={schemaType.of}
        resolveUploader={resolveUploader}
        onUpload={onUpload}
        {...elementProps}
        tabIndex={0}
      >
        <Stack data-ui="ArrayInput__content" space={3}>
          {members.length === 0 ? (
            <Card padding={3} border style={{borderStyle: 'dashed'}} radius={2}>
              <Text align="center" muted size={1}>
                {schemaType.placeholder || <>No items</>}
              </Text>
            </Card>
          ) : (
            <Card border radius={1}>
              <List gap={1} paddingY={1} onItemMove={onItemMove} sortable={sortable}>
                {members.map((member, index) => (
                  <Item key={member.key} sortable={sortable} index={index}>
                    {member.kind === 'item' && (
                      <ArrayOfObjectsItem
                        member={member}
                        renderItem={renderItem}
                        renderField={renderField}
                        renderInput={renderInput}
                        renderPreview={renderPreview}
                      />
                    )}
                    {member.kind === 'error' && <ErrorItem sortable={sortable} member={member} />}
                  </Item>
                ))}
              </List>
            </Card>
          )}
        </Stack>
      </UploadTargetCard>

      <DefaultArrayInputFunctions
        type={schemaType}
        value={value}
        readOnly={readOnly}
        onAppendItem={handleAppend}
        onPrependItem={handlePrepend}
        onCreateValue={createProtoArrayValue}
        onChange={onChange}
      />
    </Stack>
  )
}