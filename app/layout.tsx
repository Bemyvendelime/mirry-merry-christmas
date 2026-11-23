import type { Metadata } from "next";
export const metadata: Metadata = {title:"Mirry Merry Christmas",description:"눈 내린 캠퍼스 광장에서 함께 걷고 팀의 자리를 꾸며 보세요.",icons:{icon:"/star.svg"}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="ko"><body style={{margin:0}}>{children}</body></html>}
