-- Coffee Website Builder — Runnable version for real AI dispatch.
-- Run: pact run examples/coffee_run.pact --flow build_site --args "Uppsala" --dispatch claude --stream

permit_tree {
    ^llm {
        ^llm.query
    }
    ^net {
        ^net.read
    }
}

-- Templates

template %coffee_copy {
    HERO_TAGLINE :: String      <<one punchy headline for the hero>>
    HERO_SUBTITLE :: String     <<one compelling subtitle, max 20 words>>
    ABOUT :: String             <<two paragraphs about the shop's origin and values>>
    MENU_ITEM :: String * 6     <<Name | Price | Tasting Notes>>
}

template %bilingual_page {
    section ENGLISH  <<paste the original English copy exactly as received>>
    section SWEDISH  <<translate every line to Swedish, keep section labels unchanged>>
}

-- Directives

directive %nordic_design {
    <<DESIGN: Use Playfair Display for headings, Inter for body. Color palette:
    espresso brown #3C2415, cream #FFF8F0, sage green #8B9D77, amber #D4A574.
    CSS custom properties for theming. When switching to Swedish, shift accents
    to cooler Nordic tones (slate blue #5B7B8A, softer whites).>>
}

directive %glassmorphism {
    <<LAYOUT: Fixed glassmorphism navbar with backdrop-filter: blur(12px).
    Full-viewport hero. Menu as CSS Grid with hover card animations.
    About section with split layout. Sticky footer.>>
}

directive %scroll_animations {
    <<ANIMATIONS: IntersectionObserver for scroll-triggered fade-in-up on
    each section. Hero: typewriter reveal. Menu cards: stagger entrance.
    Language toggle: cross-fade 300ms transition.>>
}

directive %bilingual_toggle {
    <<LANGUAGE TOGGLE: en/sv pill toggle in navbar. data-lang attributes.
    Cross-fade text on switch. Persist in localStorage.>>
}

-- Tools

tool #research_location {
    description: <<Research a city's coffee culture: local roasters, popular
    neighborhoods, demographics, and vibe. Return a concise research brief
    of 200-300 words.>>
    requires: [^net.read]
    params {
        query :: String
    }
    returns :: String
    cache: "24h"
}

tool #write_copy {
    description: <<Write vivid marketing copy for a coffee shop website in the
    given city. Reference the local area by name. Make it feel authentic.
    Follow the output template structure exactly.>>
    requires: [^llm.query]
    output: %coffee_copy
    params {
        brief :: String
    }
    returns :: String
    retry: 2
}

tool #translate_to_swedish {
    description: <<Translate the marketing copy to Swedish. Use du-form. Adapt
    idioms naturally. Keep section labels like HERO_TAGLINE unchanged — only
    translate the copy text itself.>>
    requires: [^llm.query]
    output: %bilingual_page
    params {
        english_copy :: String
    }
    returns :: String
}

tool #generate_html {
    description: <<Generate a complete one-page HTML website with inline CSS and
    JS. You receive bilingual copy (English + Swedish). Build a beautiful
    bilingual coffee shop site. Return ONLY raw HTML starting with DOCTYPE.
    No markdown fences. No explanations.>>
    requires: [^llm.query]
    directives: [%nordic_design, %glassmorphism, %scroll_animations, %bilingual_toggle]
    params {
        content :: String
    }
    returns :: String
}

-- Agents

agent @researcher {
    permits: [^net.read, ^llm.query]
    tools: [#research_location, #write_copy]
    model: "claude-sonnet-4-20250514"
    prompt: <<You are a market research specialist and copywriter for premium
    coffee brands. When given a tool result, use it to produce real content.
    Never describe what you did — deliver the actual copy. Reference the
    local area by name. Be evocative and specific.>>
}

agent @translator {
    permits: [^llm.query]
    tools: [#translate_to_swedish]
    model: "claude-sonnet-4-20250514"
    prompt: <<You are a native Swedish translator specializing in hospitality
    marketing. Translate immediately. Never explain your process. Use du-form.
    Adapt idioms naturally.>>
}

agent @designer {
    permits: [^llm.query]
    tools: [#generate_html]
    model: "claude-sonnet-4-20250514"
    prompt: <<You are a senior frontend developer. Your websites win Awwwards.
    Production-quality HTML/CSS/JS. Modern CSS: grid, custom properties,
    clamp(), backdrop-filter. IntersectionObserver animations. SVG art instead
    of placeholder images. Only raw HTML output.>>
}

agent_bundle @coffee_team {
    agents: [@researcher, @translator, @designer]
}

-- Flow

flow build_site(city :: String) -> String {
    -- Step 1: Research the city's coffee culture
    research = @researcher -> #research_location(city)

    -- Step 2: Write English marketing copy
    english_copy = @researcher -> #write_copy(research)

    -- Step 3: Translate to Swedish
    bilingual = @translator -> #translate_to_swedish(english_copy)

    -- Step 4: Generate the HTML website
    html = @designer -> #generate_html(bilingual)

    return html
}