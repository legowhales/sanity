import styled from 'styled-components'
import {Button, ButtonProps} from '@sanity/ui'
import React, {useContext} from 'react'
import {DragHandleIcon} from '@sanity/icons'
import {DRAG_HANDLE_ATTRIBUTE} from './sortable'
import {useSortable} from '@dnd-kit/sortable'

const DragHandleButton = styled(Button)<{grid?: boolean}>`
  cursor: ${(props) => (props.grid ? 'move' : 'ns-resize')};
`

export const SortableItemIdContext = React.createContext<string | null>(null)

const DRAG_HANDLE_PROPS = {[DRAG_HANDLE_ATTRIBUTE]: true}

export const DragHandle = function DragHandle(
  props: {
    grid?: boolean
  } & ButtonProps
) {
  const id = useContext(SortableItemIdContext)!
  const {listeners} = useSortable({id})

  return (
    <DragHandleButton
      icon={DragHandleIcon}
      mode="bleed"
      data-ui="DragHandleButton"
      {...props}
      {...listeners}
      {...DRAG_HANDLE_PROPS}
    />
  )
}
