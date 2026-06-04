import { useState } from "react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { parseEther } from "viem";
const ADDR = import.meta.env.VITE_CONTRACT_ADDRESS as `0x${string}`;
const ACCENT = "#22c55e";
const ABI = [
  { name:"join", type:"function", stateMutability:"payable", inputs:[{name:"handle",type:"string"}], outputs:[] },
  { name:"getMember", type:"function", stateMutability:"view", inputs:[{name:"addr",type:"address"}], outputs:[{type:"tuple",components:[{name:"addr",type:"address"},{name:"handle",type:"string"},{name:"rank",type:"uint8"},{name:"joinedAt",type:"uint256"},{name:"points",type:"uint256"}]}] },
  { name:"isMemberOf", type:"function", stateMutability:"view", inputs:[{name:"addr",type:"address"}], outputs:[{type:"bool"}] },
  { name:"totalMembers", type:"function", stateMutability:"view", inputs:[], outputs:[{type:"uint256"}] },
  { name:"memberList", type:"function", stateMutability:"view", inputs:[{name:"idx",type:"uint256"}], outputs:[{type:"address"}] },
  { name:"joinFee", type:"function", stateMutability:"view", inputs:[], outputs:[{type:"uint256"}] },
  { name:"guildMaster", type:"function", stateMutability:"view", inputs:[], outputs:[{type:"address"}] },
] as const;
const RANKS=["Member","Knight","Elder","Leader"];
const RANK_COLORS=["#94a3b8","#a78bfa","#f59e0b","#22c55e"];
const s: Record<string,React.CSSProperties> = {
  page:{minHeight:"100vh",background:"#080b14",color:"#e2e8f0",fontFamily:"Inter,sans-serif",padding:"24px"},
  header:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:32},
  title:{fontSize:24,fontWeight:700,color:ACCENT},
  tabs:{display:"flex",gap:8,marginBottom:24},
  tab:(a:boolean)=>({padding:"8px 20px",borderRadius:8,border:"none",cursor:"pointer",background:a?ACCENT:"#1e2533",color:a?"#000":"#94a3b8",fontWeight:600}),
  card:{background:"#111827",borderRadius:12,padding:20,marginBottom:16,border:"1px solid #1e2533"},
  label:{display:"block",fontSize:13,color:"#94a3b8",marginBottom:6},
  input:{width:"100%",background:"#1e2533",border:"1px solid #374151",borderRadius:8,padding:"10px 14px",color:"#e2e8f0",fontSize:14,boxSizing:"border-box" as const,marginBottom:14},
  btn:{background:ACCENT,color:"#000",border:"none",borderRadius:8,padding:"10px 20px",fontWeight:700,cursor:"pointer",fontSize:14},
};
type GuildMember={addr:string;handle:string;rank:number;joinedAt:bigint;points:bigint};
function MemberRow({addr}:{addr:string}){
  const {data}=useReadContract({address:ADDR,abi:ABI,functionName:"getMember",args:[addr as `0x${string}`]});
  if(!data)return null;
  const m=data as GuildMember;
  if(!m.joinedAt)return null;
  return(
    <div style={{display:"flex",justifyContent:"space-between",padding:"10px 0",borderBottom:"1px solid #1e2533"}}>
      <span style={{fontWeight:600}}>{m.handle}</span>
      <span style={{color:RANK_COLORS[m.rank],fontWeight:600}}>{RANKS[m.rank]}</span>
      <span style={{fontSize:13,color:"#64748b"}}>{m.points.toString()} pts</span>
    </div>
  );
}
export default function App(){
  const {isConnected,address}=useAccount();
  const [tab,setTab]=useState<"guild"|"join"|"status">("guild");
  const [handle,setHandle]=useState("");
  const {writeContract,data:hash,isPending}=useWriteContract();
  const {isLoading:confirming}=useWaitForTransactionReceipt({hash});
  const {data:total}=useReadContract({address:ADDR,abi:ABI,functionName:"totalMembers"});
  const {data:fee}=useReadContract({address:ADDR,abi:ABI,functionName:"joinFee"});
  const {data:isMember}=useReadContract({address:ADDR,abi:ABI,functionName:"isMemberOf",args:[address!],query:{enabled:!!address}});
  const {data:myData}=useReadContract({address:ADDR,abi:ABI,functionName:"getMember",args:[address!],query:{enabled:!!address}});
  const memberCount=Number(total??0);
  const memberIndexes=Array.from({length:memberCount},(_,i)=>i);
  return(
    <div style={s.page}>
      <div style={s.header}><div><div style={s.title}>🛡️ ForgeGuild</div><div style={{fontSize:13,color:"#64748b"}}>On-chain guild system • {total?.toString()??0} members</div></div><ConnectButton/></div>
      {!isConnected?<div style={{textAlign:"center",padding:60,color:"#64748b"}}>Connect wallet to join the guild</div>:(
        <><div style={s.tabs}><button style={s.tab(tab==="guild")} onClick={()=>setTab("guild")}>Members</button><button style={s.tab(tab==="join")} onClick={()=>setTab("join")}>Join</button><button style={s.tab(tab==="status")} onClick={()=>setTab("status")}>My Status</button></div>
        {tab==="guild"&&<div style={s.card}>{memberIndexes.map(i=><MemberAddrRow key={i} idx={i}/>)}</div>}
        {tab==="join"&&<div style={s.card}>
          <div style={{fontWeight:700,marginBottom:8}}>{isMember?"Already a member!":"Join the Guild"}</div>
          {!isMember&&<><label style={s.label}>Handle</label><input style={s.input} value={handle} onChange={e=>setHandle(e.target.value)} placeholder="Your guild name..."/>
          <div style={{fontSize:13,color:"#94a3b8",marginBottom:14}}>Fee: 0.001 ETH</div>
          <button style={{...s.btn,opacity:(isPending||confirming)?0.6:1}} onClick={()=>writeContract({address:ADDR,abi:ABI,functionName:"join",args:[handle],value:fee??parseEther("0.001")})} disabled={isPending||confirming}>{isPending||confirming?"Joining...":"Join Guild 🛡️"}</button></>}
        </div>}
        {tab==="status"&&<div style={s.card}>{myData&&(myData as GuildMember).joinedAt?(<>
          <div style={{fontWeight:700,marginBottom:12}}>{(myData as GuildMember).handle}</div>
          <div style={{display:"flex",gap:20}}>
            <div><div style={{fontSize:12,color:"#64748b"}}>Rank</div><div style={{fontWeight:700,color:RANK_COLORS[(myData as GuildMember).rank]}}>{RANKS[(myData as GuildMember).rank]}</div></div>
            <div><div style={{fontSize:12,color:"#64748b"}}>Points</div><div style={{fontWeight:700}}>{(myData as GuildMember).points.toString()}</div></div>
          </div>
        </>):<div style={{color:"#64748b"}}>Not a member yet</div>}</div>}</>
      )}
    </div>
  );
}
function MemberAddrRow({idx}:{idx:number}){
  const {data:addr}=useReadContract({address:ADDR,abi:ABI,functionName:"memberList",args:[BigInt(idx)]});
  if(!addr)return null;
  return <MemberRow addr={addr as string}/>;
}