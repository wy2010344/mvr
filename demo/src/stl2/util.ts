import { cssMap } from "wy-dom-helper";

export const codeCls = cssMap({
  code: `
	padding: .15em .2em .05em;
	border-radius: .3em;
	border: .13em solid hsl(30, 20%, 40%);
	box-shadow: 1px 1px .3em -.1em black inset;
	white-space: normal;
	background: hsl(30, 20%, 25%);
  color:white;
  .token{
    &.comment{
	    color: hsl(30, 20%, 50%);
    }
    &.string{
      color:hsl(75, 70%, 60%);
    }
    &.variable{
    	color: hsl(40, 90%, 60%);
    }
    &.keyword{
      color:hsl(40, 90%, 60%);
    }
    &.number{
      color: hsl(350, 40%, 70%)
    }
    &.error{
      text-decoration-color: red;
      text-decoration-line: underline;
      text-decoration-style: wavy;
    }
  }
  `
})
