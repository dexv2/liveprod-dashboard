export default function GCLoading() {
  return (
    <div className="fixed inset-0 flex justify-center items-center bg-[rgba(0,0,0,0.5)] z-[9999]">
      <div className="animate-spin [animation-duration:1.5s] rounded-full h-24 w-24 border-t-4 border-white"></div>
    </div>
  )
}
