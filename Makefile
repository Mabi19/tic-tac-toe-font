tic-tac-toe.otf: font-withliga.ttx
	time ttx -f -o tic-tac-toe.otf font-withliga.ttx

tic-tac-toe.woff2: font-withliga.ttx
	time ttx -f --flavor woff2 -o tic-tac-toe.woff2 font-withliga.ttx

font-withliga.ttx: base-font.ttx.template inject-ligatures.ts
	bun run inject-ligatures.ts

base-font.ttx.template: base-font.ttx create-ttx-template.ts
	bun run create-ttx-template.ts

base-font.ttx: base-font.otf
	ttx -f base-font.otf

base-font.otf: create-base-font.ts
	bun run create-base-font.ts