import React from "react";
import {cleanup,render,screen} from "@testing-library/react";
import {afterEach,describe,expect,it,vi} from "vitest";

vi.mock("next/navigation",()=>({
  useRouter:()=>({refresh:vi.fn()}),
}));
vi.mock("@/lib/tx",()=>({
  waitForFinality:vi.fn(),
}));

import {ActionConsole} from "../components/ActionConsole";

afterEach(()=>cleanup());

describe("ActionConsole accessibility and safe defaults",()=>{
  it("exposes explicit connect and contract action controls",()=>{
    render(<ActionConsole migrationId="7"/>);
    expect(screen.getByRole("button",{name:/connect wallet/i})).toBeTruthy();
    expect(screen.getByRole("combobox",{name:"Contract action"})).toBeTruthy();
    expect(screen.getByRole("textbox",{name:"Write arguments"})).toBeTruthy();
  });

  it("does not enable writes without a connected injected wallet",()=>{
    render(<ActionConsole migrationId="7"/>);
    expect(screen.getByRole("button",{name:/submit write/i})).toHaveProperty("disabled",true);
  });
});
