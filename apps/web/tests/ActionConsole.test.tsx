import React from "react";
import {cleanup,render,screen} from "@testing-library/react";
import {afterEach,describe,it,expect,vi} from "vitest";
vi.mock("../components/ContractSubmit",()=>({useContractSubmit:()=>({submit:vi.fn(),phase:null,message:"",confirmed:null,busy:false,wallet:{account:null,networkOk:false}}),TxFeedback:()=>null}));
import {ActionConsole} from "../components/ActionConsole";
afterEach(cleanup);
describe("advanced developer console",()=>{
 it("is collapsed behind an Advanced disclosure",()=>{render(<ActionConsole migrationId="7"/>);expect(screen.getByText(/Advanced \/ developer contract console/i)).toBeTruthy();expect(screen.getByText(/guided workflow above is the primary product surface/i)).toBeTruthy()});
 it("keeps raw write disabled without wallet/network",()=>{render(<ActionConsole migrationId="7"/>);expect(screen.getByRole("button",{name:/submit raw write/i})).toHaveProperty("disabled",true)});
});
