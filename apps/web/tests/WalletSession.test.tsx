import React from "react";
import {act,cleanup,fireEvent,render,screen,waitFor} from "@testing-library/react";
import {afterEach,beforeEach,describe,it,expect,vi} from "vitest";
import {WalletBar,WalletSessionProvider} from "../components/WalletSession";
const listeners:Record<string,(value:unknown)=>void>={};let chain="0xf22f";let accounts=["0x1111111111111111111111111111111111111111"];
const provider={request:vi.fn(async({method}:{method:string})=>{if(method==="eth_requestAccounts")return accounts;if(method==="eth_chainId")return chain;if(method==="wallet_switchEthereumChain"){chain="0xf22f";return null}return null}),on:vi.fn((e:string,fn:(v:unknown)=>void)=>{listeners[e]=fn}),removeListener:vi.fn()};
afterEach(cleanup);beforeEach(()=>{Object.keys(listeners).forEach(k=>delete listeners[k]);chain="0xf22f";accounts=["0x1111111111111111111111111111111111111111"];Object.defineProperty(window,"ethereum",{value:provider,writable:true,configurable:true});provider.request.mockClear();provider.on.mockClear();provider.removeListener.mockClear();});
describe("injected wallet synchronization",()=>{
 it("connects and recognizes Studionet",async()=>{render(<WalletSessionProvider><WalletBar/></WalletSessionProvider>);fireEvent.click(screen.getByRole("button",{name:/connect wallet/i}));await screen.findByText(/0x111111/i);expect(screen.getByText(/Studionet 61999/)).toBeTruthy()});
 it("reacts to account changes",async()=>{render(<WalletSessionProvider><WalletBar/></WalletSessionProvider>);fireEvent.click(screen.getByRole("button",{name:/connect wallet/i}));await screen.findByText(/0x111111/i);await act(async()=>listeners.accountsChanged?.(["0x2222222222222222222222222222222222222222"]));expect(screen.getByText(/0x222222/i)).toBeTruthy()});
 it("reacts to chain changes and offers recovery",async()=>{render(<WalletSessionProvider><WalletBar/></WalletSessionProvider>);fireEvent.click(screen.getByRole("button",{name:/connect wallet/i}));await screen.findByText(/Studionet 61999/);await act(async()=>listeners.chainChanged?.("0x1"));expect(screen.getByRole("button",{name:/switch to 61999/i})).toBeTruthy();fireEvent.click(screen.getByRole("button",{name:/switch to 61999/i}));await waitFor(()=>expect(provider.request).toHaveBeenCalledWith(expect.objectContaining({method:"wallet_switchEthereumChain"}))) });
});
