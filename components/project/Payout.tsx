import { useAuth } from '@/app/hooks/useAuth'
import React from 'react'
import PayoutEngineer from './PayoutEngineer';
import PayoutClient from './PayoutClient';
import PayoutAdmin from './PayoutAdmin';
interface Props{projectId: string};
export default function Payout({projectId}:Props) {
  const {role} = useAuth();
  switch(role){
    case "ENGINEER":
        return <PayoutEngineer projectId={projectId}/>
    case "CLIENT":
        return <PayoutClient projectId={projectId}/>
    case "ADMIN":
        return <PayoutAdmin projectId={projectId}/>
    default: 
        return <div className='h-screen w-full flex items-center justify-center'>Not Found!</div>
  }
}
