import React from "react";
import {act,cleanup,fireEvent,render,screen,waitFor} from "@testing-library/react";
import {afterEach,beforeEach,describe,it,expect,vi} from "vitest";
import {GlobalNavbar} from "../components/GlobalNavbar";
import {WalletBar,WalletSessionProvider} from "../components/WalletSession";

const firstAccount="0x1111111111111111111111111111111111111111";
const listeners:Record<string,(value:unknown)=>void>={};
let chain="0xf22f";
let accounts:string[]=[];
const provider={request:vi.fn(async({method}:{method:string})=>{
  if(method==="eth_requestAccounts")return accounts.length?accounts:[firstAccount];
  if(method==="eth_accounts")return accounts;
  if(method==="eth_chainId")return chain;
  if(method==="wallet_switchEthereumChain"){chain="0xf22f";return null;}
  return null;
}),on:vi.fn((event:string,listener:(value:unknown)=>void)=>{listeners[event]=listener;}),removeListener:vi.fn()};

afterEach(cleanup);
beforeEach(()=>{
  Object.keys(listeners).forEach(key=>delete listeners[key]);
  chain="0xf22f";accounts=[];
  Object.defineProperty(window,"ethereum",{value:provider,writable:true,configurable:true});
  Object.defineProperty(navigator,"clipboard",{value:{writeText:vi.fn().mockResolvedValue(undefined)},writable:true,configurable:true});
  provider.request.mockClear();provider.on.mockClear();provider.removeListener.mockClear();
});

describe("shared injected wallet navigation",()=>{
  it("explains when no injected wallet is available",()=>{
    Object.defineProperty(window,"ethereum",{value:undefined,writable:true,configurable:true});
    render(<WalletSessionProvider><GlobalNavbar/><WalletBar/></WalletSessionProvider>);
    expect(screen.getByRole("button",{name:/connect wallet/i}).hasAttribute("disabled")).toBe(true);
    expect(screen.getAllByText(/no injected wallet/i).length).toBeGreaterThan(0);
  });

  it("uses the navbar as the only primary connect action",async()=>{
    render(<WalletSessionProvider><GlobalNavbar/><WalletBar/></WalletSessionProvider>);
    expect(screen.getAllByRole("button",{name:/connect wallet/i})).toHaveLength(1);
    fireEvent.click(screen.getByRole("button",{name:/connect wallet/i}));
    await screen.findByRole("button",{name:/0x1111/i});
    expect(screen.getByText(/Studionet · 61999/)).toBeTruthy();
  });

  it("restores an authorized account and chain after refresh",async()=>{
    accounts=["0x3333333333333333333333333333333333333333"];
    render(<WalletSessionProvider><GlobalNavbar/><WalletBar/></WalletSessionProvider>);
    await screen.findByRole("button",{name:/0x3333/i});
    expect(provider.request).toHaveBeenCalledWith({method:"eth_accounts"});
    expect(screen.getByText(/Studionet · 61999/)).toBeTruthy();
  });

  it("copies the full address and disconnects from the connected-wallet menu",async()=>{
    render(<WalletSessionProvider><GlobalNavbar/></WalletSessionProvider>);
    fireEvent.click(screen.getByRole("button",{name:/connect wallet/i}));
    fireEvent.click(await screen.findByRole("button",{name:/0x1111/i}));
    fireEvent.click(screen.getByRole("button",{name:/copy address/i}));
    expect(await screen.findByText(/address copied/i)).toBeTruthy();
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(firstAccount);
    fireEvent.click(screen.getByRole("button",{name:/disconnect/i}));
    expect(await screen.findByRole("button",{name:/connect wallet/i})).toBeTruthy();
  });

  it("keeps account-change events synchronized between navbar and transaction status",async()=>{
    render(<WalletSessionProvider><GlobalNavbar/><WalletBar/></WalletSessionProvider>);
    fireEvent.click(screen.getByRole("button",{name:/connect wallet/i}));
    await screen.findByRole("button",{name:/0x1111/i});
    await act(async()=>listeners.accountsChanged?.(["0x2222222222222222222222222222222222222222"]));
    expect(await screen.findByRole("button",{name:/0x2222/i})).toBeTruthy();
    expect(screen.getAllByText(/0x2222/).length).toBeGreaterThan(1);
    await act(async()=>listeners.accountsChanged?.([]));
    expect(await screen.findByRole("button",{name:/connect wallet/i})).toBeTruthy();
    expect(screen.getByText(/wallet disconnected/i)).toBeTruthy();
  });

  it("offers a clear Studionet switch after a wrong-network event",async()=>{
    render(<WalletSessionProvider><GlobalNavbar/></WalletSessionProvider>);
    fireEvent.click(screen.getByRole("button",{name:/connect wallet/i}));
    await screen.findByRole("button",{name:/0x1111/i});
    await act(async()=>listeners.chainChanged?.("0x1"));
    fireEvent.click(await screen.findByRole("button",{name:/wrong network/i}));
    fireEvent.click(screen.getByRole("button",{name:/switch to studionet/i}));
    await waitFor(()=>expect(provider.request).toHaveBeenCalledWith(expect.objectContaining({method:"wallet_switchEthereumChain"})));
    expect(await screen.findByRole("button",{name:/0x1111/i})).toBeTruthy();
  });

  it("adds the Studionet network when the wallet does not know it yet",async()=>{
    provider.request.mockImplementation(async({method}:{method:string})=>{
      if(method==="eth_requestAccounts")return [firstAccount];
      if(method==="eth_accounts")return accounts;
      if(method==="eth_chainId")return chain;
      if(method==="wallet_switchEthereumChain")throw Object.assign(new Error("Unknown chain"),{code:4902});
      if(method==="wallet_addEthereumChain"){chain="0xf22f";return null;}
      return null;
    });
    render(<WalletSessionProvider><GlobalNavbar/></WalletSessionProvider>);
    fireEvent.click(screen.getByRole("button",{name:/connect wallet/i}));
    await screen.findByRole("button",{name:/0x1111/i});
    await act(async()=>listeners.chainChanged?.("0x1"));
    fireEvent.click(await screen.findByRole("button",{name:/wrong network/i}));
    fireEvent.click(screen.getByRole("button",{name:/switch to studionet/i}));
    await waitFor(()=>expect(provider.request).toHaveBeenCalledWith(expect.objectContaining({method:"wallet_addEthereumChain"})));
    expect(await screen.findByRole("button",{name:/0x1111/i})).toBeTruthy();
    expect(screen.getByText(/Studionet · 61999/)).toBeTruthy();
  });
});
