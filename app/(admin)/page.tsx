/* eslint-disable import/no-default-export */
import { redirect } from 'next/navigation'

export default function AdminRootPage() {
  redirect('/dashboard')
}
