import {Box, Grid} from '@sanity/ui'
import React, {ComponentProps, useCallback} from 'react'
import styled, {css} from 'styled-components'
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import {CSS} from '@dnd-kit/utilities'
import {
  restrictToParentElement,
  restrictToVerticalAxis,
  restrictToWindowEdges,
} from '@dnd-kit/modifiers'
import {SortableItemIdContext} from './DragHandle'

const activeCss = css`
  z-index: 10000;
  /* prevents hover-effects etc on elements inside while reordering  */
  pointer-events: none;
  /* todo: this requires items to add this attr. Check if there's a better way */
  [data-ui='Item'] {
    box-shadow: 0 0 0 0, 0 8px 17px 2px var(--card-shadow-umbra-color),
      0 3px 14px 2px var(--card-shadow-penumbra-color),
      0 5px 5px -3px var(--card-shadow-ambient-color);
  }
`

const ListItem = styled(Box)<ComponentProps<typeof Box> & {active?: boolean}>`
  ${(props) => props.active && activeCss}
`

function SortableList(props: ListProps) {
  const {items, sortable, lockAxis, axis, onItemMove, children, ...rest} = props
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  function handleDragEnd(event: DragEndEvent) {
    const {active, over} = event

    if (active.id !== over?.id) {
      props.onItemMove?.({
        fromIndex: props.items.indexOf(active.id as string),
        toIndex: props.items.indexOf(over?.id as string),
      })
    }
  }
  return (
    <DndContext
      sensors={sensors}
      modifiers={[restrictToVerticalAxis, restrictToWindowEdges, restrictToParentElement]}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={props.items} strategy={verticalListSortingStrategy}>
        <Grid {...rest}>{children}</Grid>
      </SortableContext>
    </DndContext>
  )
}

function SortableListItem(props: ItemProps) {
  const {id, children} = props
  const {attributes, setNodeRef, transform, transition, active} = useSortable({id})

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    ...(active ? {pointerEvents: 'none' as const} : {}),
  }
  const isActive = id === active?.id
  return (
    <ListItem ref={setNodeRef} style={style} {...attributes} active={isActive}>
      {children}
    </ListItem>
  )
}

interface ListProps extends ComponentProps<typeof Grid> {
  sortable?: boolean
  lockAxis?: 'x' | 'y' | 'xy'
  axis?: 'x' | 'y' | 'xy'
  items: string[]
  onItemMove?: (event: {fromIndex: number; toIndex: number}) => void
  children?: React.ReactNode
  tabIndex?: number
}

export function List(props: ListProps) {
  const {onItemMove, sortable, ...rest} = props

  // Note: this is here to make SortableList API compatible with onItemMove
  const handleSortEnd = useCallback(
    (event: {fromIndex: number; toIndex: number}) => onItemMove?.(event),
    [onItemMove]
  )

  return sortable ? <SortableList onItemMove={handleSortEnd} {...rest} /> : <Grid {...rest} />
}

interface ItemProps {
  sortable?: boolean
  children?: React.ReactNode
  id: string
}

export function Item(props: ItemProps & ComponentProps<typeof Card>) {
  const {sortable, ...rest} = props
  return (
    <SortableItemIdContext.Provider value={props.id}>
      {sortable ? <SortableListItem {...rest} /> : <ListItem {...rest} />}
    </SortableItemIdContext.Provider>
  )
}
