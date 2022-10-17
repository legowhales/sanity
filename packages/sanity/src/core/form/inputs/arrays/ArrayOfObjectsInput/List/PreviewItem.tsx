import {
  Box,
  Button,
  Card,
  CardTone,
  Flex,
  Menu,
  MenuButton,
  MenuItem,
  Spinner,
  Text,
} from '@sanity/ui'
import React, {ReactNode, useCallback, useMemo, useRef} from 'react'
import {SchemaType} from '@sanity/types'
import {CopyIcon as DuplicateIcon, EllipsisVerticalIcon, TrashIcon} from '@sanity/icons'
import {getSchemaTypeTitle} from '../../../../../schema'
import {ObjectItem, ObjectItemProps} from '../../../../types'
import {useScrollIntoViewOnFocusWithin} from '../../../../hooks/useScrollIntoViewOnFocusWithin'
import {useDidUpdate} from '../../../../hooks/useDidUpdate'
import {useChildPresence} from '../../../../studio/contexts/Presence'
import {randomKey} from '../../../../utils/randomKey'
import {FormFieldValidationStatus} from '../../../../components'
import {FieldPresence} from '../../../../../presence'
import {useChildValidation} from '../../../../studio/contexts/Validation'
import {ChangeIndicator} from '../../../../../changeIndicators'
import {RowLayout} from '../../layouts/RowLayout'
import {createProtoArrayValue} from '../createProtoArrayValue'
import {InsertMenu} from '../InsertMenu'
import {EditPortal} from '../../../../components/EditPortal'

interface Props<Item extends ObjectItem> extends Omit<ObjectItemProps<Item>, 'renderDefault'> {
  insertableTypes: SchemaType[]
  value: Item
  preview: ReactNode
  sortable: boolean
}

function getTone({
  readOnly,
  hasErrors,
  hasWarnings,
}: {
  readOnly: boolean | undefined
  hasErrors: boolean
  hasWarnings: boolean
}): CardTone {
  if (readOnly) {
    return 'transparent'
  }
  if (hasErrors) {
    return 'critical'
  }
  return hasWarnings ? 'caution' : 'default'
}
const MENU_POPOVER_PROPS = {portal: true, tone: 'default'} as const

export function PreviewItem<Item extends ObjectItem = ObjectItem>(props: Props<Item>) {
  const {
    schemaType,
    path,
    readOnly,
    onRemove,
    value,
    open,
    onInsert,
    onFocus,
    onOpen,
    onClose,
    inputId,
    changed,
    focused,
    children,
    sortable,
    preview,
    insertableTypes,
  } = props

  const previewCardRef = useRef<HTMLDivElement | null>(null)

  // this is here to make sure the item is visible if it's being edited behind a modal
  useScrollIntoViewOnFocusWithin(previewCardRef, open)

  useDidUpdate(focused, (hadFocus, hasFocus) => {
    if (!hadFocus && hasFocus && previewCardRef.current) {
      // Note: if editing an inline item, focus is handled by the item input itself and no ref is being set
      previewCardRef.current?.focus()
    }
  })

  const resolvingInitialValue = (value as any)._resolvingInitialValue

  const handleDuplicate = useCallback(() => {
    onInsert({
      items: [{...value, _key: randomKey()}],
      position: 'after',
    })
  }, [onInsert, value])

  const handleInsert = useCallback(
    (pos: 'before' | 'after', insertType: SchemaType) => {
      onInsert({
        items: [createProtoArrayValue(insertType)],
        position: pos,
      })
    },
    [onInsert]
  )

  const childPresence = useChildPresence(path, true)
  const presence = useMemo(() => {
    return childPresence.length === 0 ? null : (
      <FieldPresence presence={childPresence} maxAvatars={1} />
    )
  }, [childPresence])

  const childValidation = useChildValidation(path, true)
  const validation = useMemo(() => {
    return childValidation.length === 0 ? null : (
      <Box marginLeft={1} paddingX={1} paddingY={3}>
        <FormFieldValidationStatus validation={childValidation} __unstable_showSummary />
      </Box>
    )
  }, [childValidation])

  const hasErrors = childValidation.some((v) => v.level === 'error')
  const hasWarnings = childValidation.some((v) => v.level === 'warning')

  const menu = useMemo(
    () =>
      readOnly ? null : (
        <MenuButton
          button={<Button padding={2} mode="bleed" icon={EllipsisVerticalIcon} />}
          id={`${props.inputId}-menuButton`}
          menu={
            <Menu>
              <MenuItem text="Remove" tone="critical" icon={TrashIcon} onClick={onRemove} />
              <MenuItem text="Duplicate" icon={DuplicateIcon} onClick={handleDuplicate} />
              <InsertMenu types={insertableTypes} onInsert={handleInsert} />
            </Menu>
          }
          popover={MENU_POPOVER_PROPS}
        />
      ),
    [handleDuplicate, handleInsert, onRemove, insertableTypes, props.inputId, readOnly]
  )

  const tone = getTone({readOnly, hasErrors, hasWarnings})
  const item = (
    <RowLayout
      menu={menu}
      presence={presence}
      validation={validation}
      tone={tone}
      focused={focused}
      dragHandle={sortable}
      selected={open}
    >
      <Card
        as="button"
        type="button"
        tone="inherit"
        radius={2}
        disabled={resolvingInitialValue}
        padding={1}
        onClick={onOpen}
        ref={previewCardRef}
        onFocus={onFocus}
        __unstable_focusRing
        style={{position: 'relative'}}
      >
        {preview}
        {resolvingInitialValue && (
          <Card
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              opacity: 0.6,
            }}
            tone="transparent"
            as={Flex}
            radius={2}
            //eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            justify="center"
          >
            <Flex align="center" justify="center" padding={3}>
              <Box marginX={3}>
                <Spinner muted />
              </Box>
              <Text>Resolving initial value…</Text>
            </Flex>
          </Card>
        )}
      </Card>
    </RowLayout>
  )

  const itemTypeTitle = getSchemaTypeTitle(schemaType)
  return (
    <>
      <ChangeIndicator path={path} isChanged={changed} hasFocus={Boolean(focused)}>
        <Box paddingX={1}>{item}</Box>
      </ChangeIndicator>
      {open && (
        <EditPortal
          header={readOnly ? `View ${itemTypeTitle}` : `Edit ${itemTypeTitle}`}
          type={schemaType?.options?.modal?.type || 'dialog'}
          id={value._key}
          onClose={onClose}
          legacy_referenceElement={previewCardRef.current}
        >
          {children}
        </EditPortal>
      )}
    </>
  )
}
