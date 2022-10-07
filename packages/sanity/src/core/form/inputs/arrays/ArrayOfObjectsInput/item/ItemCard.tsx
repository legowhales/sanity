import {Card} from '@sanity/ui'
import styled from 'styled-components'

export const ItemCard = styled(Card)`
  border: 1px solid transparent;
  &[aria-selected='true'] {
    border-color: var(--card-focus-ring-color);
  }
`
