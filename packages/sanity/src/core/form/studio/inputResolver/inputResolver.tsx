/* eslint-disable react/jsx-handler-names */
import {
  ArraySchemaType,
  isBooleanSchemaType,
  isReferenceSchemaType,
  NumberSchemaType,
  SchemaType,
  StringSchemaType,
} from '@sanity/types'
import React from 'react'
import {FieldMember} from '../../store'
import {ArrayFieldProps, FieldProps, InputProps, ItemProps, ObjectFieldProps} from '../../types'
import * as is from '../../utils/is'
import {FormField, FormFieldSet} from '../../components/formField'
import {PreviewProps} from '../../../components'
import {ChangeIndicator} from '../../../changeIndicators'
import {SanityPreview} from '../../../preview'
import {FIXME} from '../../../FIXME'
import {ReferenceField} from '../../inputs/ReferenceInput/ReferenceField'
import {StudioReferenceInput} from '../inputs/reference/StudioReferenceInput'
import {resolveArrayInput} from './resolveArrayInput'
import {resolveStringInput} from './resolveStringInput'
import {resolveNumberInput} from './resolveNumberInput'
import {defaultInputs} from './defaultInputs'

function resolveComponentFromTypeVariants(
  type: SchemaType
): React.ComponentType<FIXME> | undefined {
  if (is.type('array', type)) {
    return resolveArrayInput(type as ArraySchemaType)
  }

  if (is.type('reference', type)) {
    return StudioReferenceInput
  }

  // String input with a select
  if (is.type('string', type)) {
    return resolveStringInput(type as StringSchemaType)
  }

  if (is.type('number', type)) {
    return resolveNumberInput(type as NumberSchemaType)
  }

  return undefined
}

function getTypeChain(type: SchemaType | undefined, visited: Set<SchemaType>): SchemaType[] {
  if (!type) return []
  if (visited.has(type)) return []

  visited.add(type)

  const next = type.type ? getTypeChain(type.type, visited) : []
  return [type, ...next]
}

export function defaultResolveInputComponent(
  schemaType: SchemaType
): React.ComponentType<Omit<InputProps, 'renderDefault'>> {
  if (schemaType.components?.input) return schemaType.components.input

  const componentFromTypeVariants = resolveComponentFromTypeVariants(schemaType)
  if (componentFromTypeVariants) {
    return componentFromTypeVariants
  }

  const typeChain = getTypeChain(schemaType, new Set())
  const deduped = typeChain.reduce((acc, type) => {
    acc[type.name] = type
    return acc
  }, {} as Record<string, SchemaType>)

  // using an object + Object.values to de-dupe the type chain by type name
  const subType = Object.values(deduped).find((t) => defaultInputs[t.name])

  if (subType) {
    return defaultInputs[subType.name]
  }

  throw new Error(`Could not find input component for schema type \`${schemaType.name}\``)
}

function NoopField({children}: {children: React.ReactNode}) {
  return <>{children}</>
}

function PrimitiveField(field: FieldProps) {
  return (
    <FormField
      data-testid={`field-${field.inputId}`}
      level={field.level}
      title={field.title}
      description={field.description}
      validation={field.validation}
      __unstable_presence={field.presence}
    >
      <ChangeIndicator
        path={field.path}
        hasFocus={Boolean(field.inputProps.focused)}
        isChanged={field.inputProps.changed}
      >
        {field.children}
      </ChangeIndicator>
    </FormField>
  )
}

function ObjectOrArrayField(field: ObjectFieldProps | ArrayFieldProps) {
  return (
    <FormFieldSet
      data-testid={`field-${field.inputId}`}
      level={field.level}
      title={field.title}
      description={field.description}
      collapsed={field.collapsed}
      collapsible={field.collapsible}
      onCollapse={field.onCollapse}
      onExpand={field.onExpand}
      validation={field.validation}
      __unstable_presence={field.presence}
    >
      {field.children}
    </FormFieldSet>
  )
}

function ImageOrFileField(field: ObjectFieldProps) {
  // unless the hotspot tool dialog is open we want to show whoever is in there as the field presence
  const hotspotField = field.inputProps.members.find(
    (member): member is FieldMember => member.kind === 'field' && member.name === 'hotspot'
  )
  const presence = hotspotField?.open
    ? field.presence
    : field.presence.concat(hotspotField?.field.presence || [])

  return (
    <FormFieldSet
      level={field.level}
      title={field.title}
      description={field.description}
      collapsed={field.collapsed}
      collapsible={field.collapsible}
      onCollapse={field.onCollapse}
      onExpand={field.onExpand}
      validation={field.validation}
      __unstable_presence={presence}
    >
      {field.children}
    </FormFieldSet>
  )
}

export function defaultResolveFieldComponent(
  schemaType: SchemaType
): React.ComponentType<Omit<FieldProps, 'renderDefault'>> {
  if (schemaType.components?.field) return schemaType.components.field

  if (isBooleanSchemaType(schemaType)) {
    return NoopField
  }

  const typeChain = getTypeChain(schemaType, new Set())

  if (typeChain.some((t) => t.name === 'image' || t.name === 'file')) {
    return ImageOrFileField as React.ComponentType<Omit<FieldProps, 'renderDefault'>>
  }
  if (typeChain.some((t) => isReferenceSchemaType(t))) {
    return ReferenceField as React.ComponentType<Omit<FieldProps, 'renderDefault'>>
  }

  if (schemaType.jsonType !== 'object' && schemaType.jsonType !== 'array') {
    return PrimitiveField as React.ComponentType<Omit<FieldProps, 'renderDefault'>>
  }

  return ObjectOrArrayField as React.ComponentType<Omit<FieldProps, 'renderDefault'>>
}

export function defaultResolveItemComponent(
  schemaType: SchemaType
): React.ComponentType<Omit<ItemProps, 'renderDefault'>> {
  if (schemaType.components?.item) return schemaType.components.item

  return NoopField
}

export function defaultResolvePreviewComponent(): React.ComponentType<
  Omit<PreviewProps, 'renderDefault'>
> {
  return SanityPreview as any
}
