import Image from 'next/image'

export default function GCLoading() {
  return (
    // <div className="flex justify-center items-center h-96">
    //   <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
    // </div>
    <div className="flex justify-center items-center absolute inset-0">
      <Image unoptimized src="/cute-smiley.gif" alt="loading" width={200} height={200} />
    </div>
  )
}
