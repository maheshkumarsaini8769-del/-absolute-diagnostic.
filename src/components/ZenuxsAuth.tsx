'use client'

import React from 'react'

export function ZenuxsAuth(props: any) {
  const { innerRef, ...rest } = props
  return React.createElement('zenuxs-auth', { ref: innerRef, ...rest })
}
