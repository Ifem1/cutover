import React from "react";
import {render,screen} from "@testing-library/react";
import {describe,expect,it} from "vitest";
import {ActionConsole} from "../components/ActionConsole";

describe("ActionConsole accessibility and safe defaults",()=>{
  it("exposes explicit connect and contract action controls",()=>{
    render(<ActionConsole migrationId="7"/>);
    expect(screen.getByRole("button",{name:/connect wallet/i})).toBeTruthy();
    expect(screen.getByLabelText(/contract action/i)).toBeTruthy();
    expect(screen.getByLabelText(/write arguments/i)).toBeTruthy();
  });
  it("does not enable writes without a connected injected wallet",()=>{
    render(<ActionConsole migrationId="7"/>);
    expect(screen.getByRole("button",{name:/submit write/i})).toHaveProperty("disabled",true);
  });
});
