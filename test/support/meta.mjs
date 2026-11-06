// A provider-shaped fixture. Tests using this helper never call Meta.
export function citedAnswer(place, reason) {
  const prefix = place.id + ' | ';
  const text = prefix + reason;
  return {
    status: 'completed',
    output: [
      {type: 'web_search_call', status: 'completed'},
      {type:'message', role:'assistant', status:'completed', content:[{
        type:'output_text', text,
        annotations:[{type:'url_citation', url:place.source, start_index:prefix.length, end_index:Array.from(text).length}]
      }]}
    ]
  };
}
