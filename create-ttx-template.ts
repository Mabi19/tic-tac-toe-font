// Pretty much just copied from the Bad Apple font
let file = await Bun.file("./base-font.ttx").text();

file = file.replace(
    `<!-- LookupCount=1 -->
          <LookupListIndex index="0" value="0"/>`,
    "<!-- LookupCount={{LOOKUP_LIST_INDICES_LENGTH}} -->\n{{LOOKUP_LIST_INDICES}}"
);
file = file.replace(
    `<!-- LookupCount=1 -->
      <Lookup index="0">
        <LookupType value="4"/>
        <LookupFlag value="0"/>
        <!-- SubTableCount=1 -->
        <LigatureSubst index="0">
          <LigatureSet glyph="board0">
            <Ligature components="board1" glyph="start1"/>
          </LigatureSet>
        </LigatureSubst>
      </Lookup>`,
    "<!-- LookupCount={{LOOKUP_LIST_LENGTH}} -->\n{{LOOKUP_LIST}}"
);

await Bun.write("./base-font.ttx.template", file);
