import React from "react";
import {fireEvent,render,screen,waitFor} from "@testing-library/react";
import {describe,it,expect,vi} from "vitest";
const submit=vi.fn().mockResolvedValue({});
vi.mock("../components/ContractSubmit",()=>({useContractSubmit:()=>({submit,phase:null,message:"",confirmed:null,busy:false,wallet:{account:"0x1111111111111111111111111111111111111111",networkOk:true}}),TxFeedback:()=>null}));
import {CreateMigrationForm} from "../components/CreateMigrationForm";
describe("migration creation form",()=>{
 it("collects structured migration fields",()=>{render(<CreateMigrationForm/>);expect(screen.getByLabelText("Migration title")).toBeTruthy();expect(screen.getByLabelText("Baseline origin")).toBeTruthy();expect(screen.getByLabelText("Review window seconds")).toBeTruthy()});
 it("submits exact typed contract arguments",async()=>{render(<CreateMigrationForm/>);fireEvent.change(screen.getByLabelText("Migration title"),{target:{value:"Docs cutover"}});fireEvent.change(screen.getByLabelText("Baseline origin"),{target:{value:"https://old.example"}});fireEvent.change(screen.getByLabelText("Review window seconds"),{target:{value:"600"}});fireEvent.click(screen.getByRole("button",{name:"Create migration"}));await waitFor(()=>expect(submit).toHaveBeenCalledWith("create_migration",["Docs cutover","https://old.example",600]))});
});
