import React from "react";
import {render,screen} from "@testing-library/react";
import {describe,it,expect,vi} from "vitest";

type LinkProps=React.AnchorHTMLAttributes<HTMLAnchorElement>&{href:string;children:React.ReactNode};
vi.mock("next/link",()=>({default:({href,children,...rest}:LinkProps)=><a href={href} {...rest}>{children}</a>}));

import {RouteMatrix} from "../components/RouteMatrix";
const rows=[{id:"pricing",href:"/migrations/1/routes/pricing",route:"https://old.example/pricing",destination:"https://new.example/pricing",rules:2,frozen:true,status:"BLOCKED",attempts:1,decisive:"pricing: MATERIAL_CHANGE"}];
describe("route preservation matrix",()=>{
 it("links every route to its evidence page",()=>{render(<RouteMatrix rows={rows}/>);expect(screen.getByRole("link",{name:/pricing/i})).toHaveProperty("href","http://localhost:3000/migrations/1/routes/pricing")});
 it("shows status text in addition to visual mark",()=>{render(<RouteMatrix rows={rows}/>);expect(screen.getAllByText("BLOCKED").length).toBeGreaterThan(0);expect(screen.getByText(/MATERIAL_CHANGE/)).toBeTruthy()});
});
