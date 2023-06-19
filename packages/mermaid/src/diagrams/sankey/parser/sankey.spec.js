import diagram from './sankey.jison';
import { parser } from './sankey.jison';
import db from '../sankeyDB.js';
// import { fail } from 'assert';

describe('Sankey diagram', function () {
  // TODO - these examples should be put into ./parser/stateDiagram.spec.js
  describe('when parsing an info graph it', function () {
    beforeEach(function () {
      parser.yy = db;
      diagram.parser.yy = db;
      diagram.parser.yy.clear();
    });

    it('recognizes its type', () => {
      const str = `sankey`;

      parser.parse(str);
    });

    it('recognizes one flow', () => {
      const str = `
      sankey
      node_a -> 30 -> node_b -> 20 -> node_c
      `;

      parser.parse(str);
    });

    it('recognizes multiple flows', () => {
      const str = `
      sankey
      node_a -> 30 -> node_b -> 12 -> node_e
      node_c -> 30 -> node_d -> 12 -> node_e
      node_c -> 40 -> node_e -> 12 -> node_q
      `;

      parser.parse(str);
    });

    it('parses node as a string', () => {
      const str = `
      sankey
      "node a" -> 30 -> "node b" -> 12 -> "node e"
      "node c" -> 30 -> "node d" -> 12 -> "node e"
      "node c" -> 40 -> "node e" -> 12 -> "node q"
      `;

      parser.parse(str);
    });

    describe('while attributes parsing', () => {
      it('parses different quotless variations', () => {
        const str = `
        sankey
        node[]

        node[attr=1]
        node_a -> 30 -> node_b
        node[attrWithoutValue]
        node[attr = 3]
        node[attr1 = 23413 attr2=1234]
        node[x1dfqowie attr1 = 23413 attr2]
        `;

        parser.parse(str);
      });

      it('parses strings as values', () => {
        const str = `
        sankey
        node[title="hello, how are you?"]
        node[title="hello, mister \\"sankey\\", backslash for you \\\\"]
        `;

        parser.parse(str);
      });

      it('parses truly complex example', () => {
        const str = `
        sankey

        "Agricultural 'waste'"      ->      124.729  -> "Bio-conversion"
        "Bio-conversion"            ->      0.597    -> "Liquid"
        "Bio-conversion"            ->      26.862   -> "Losses"
        "Bio-conversion"            ->      280.322  -> "Solid"
        "Bio-conversion"            ->      81.144   -> "Gas"
        "Biofuel imports"           ->      35       -> "Liquid"
        "Biomass imports"           ->      35       -> "Solid"
        "Coal imports"              ->      11.606   -> "Coal"
        "Coal reserves"             ->      63.965   -> "Coal"
        "Coal"                      ->      75.571   -> "Solid"
        "District heating"          ->      10.639   -> "Industry"
        "District heating"          ->      22.505   -> "Heating and cooling - commercial"
        "District heating"          ->      46.184   -> "Heating and cooling - homes"
        "Electricity grid"          ->      104.453  -> "Over generation / exports"
        "Electricity grid"          ->      113.726  -> "Heating and cooling - homes"
        "Electricity grid"          ->      27.14    -> "H2 conversion"
        "Electricity grid"          ->      342.165  -> "Industry"
        "Electricity grid"          ->      37.797   -> "Road transport"
        "Electricity grid"          ->      4.412    -> "Agriculture"
        "Electricity grid"          ->      40.858   -> "Heating and cooling - commercial"
        "Electricity grid"          ->      56.691   -> "Losses"
        "Electricity grid"          ->      7.863    -> "Rail transport"
        "Electricity grid"          ->      90.008   -> "Lighting & appliances - commercial"
        "Electricity grid"          ->      93.494   -> "Lighting & appliances - homes"
        "Gas imports"               ->      40.719   -> "Ngas"
        "Gas reserves"              ->      82.233   -> "Ngas"
        "Gas"                       ->      0.129    -> "Heating and cooling - commercial"
        "Gas"                       ->      1.401    -> "Losses"
        "Gas"                       ->      151.891  -> "Thermal generation"
        "Gas"                       ->      2.096    -> "Agriculture"
        "Gas"                       ->      48.58    -> "Industry"
        "Geothermal"                ->      7.013    -> "Electricity grid"
        "H2 conversion"             ->      20.897   -> "H2"
        "H2 conversion"             ->      6.242    -> "Losses"
        "H2"                        ->      20.897   -> "Road transport"
        "Hydro"                     ->      6.995    -> "Electricity grid"
        "Liquid"                    ->      121.066  -> "Industry"
        "Liquid"                    ->      128.69   -> "International shipping"
        "Liquid"                    ->      135.835  -> "Road transport"
        "Liquid"                    ->      14.458   -> "Domestic aviation"
        "Liquid"                    ->      206.267  -> "International aviation"
        "Liquid"                    ->      3.64     -> "Agriculture"
        "Liquid"                    ->      33.218   -> "National navigation"
        "Liquid"                    ->      4.413    -> "Rail transport"
        "Marine algae"              ->      4.375    -> "Bio-conversion"
        "Ngas"                      ->      122.952  -> "Gas"
        "Nuclear"                   ->      839.978  -> "Thermal generation"
        "Oil imports"               ->      504.287  -> "Oil"
        "Oil reserves"              ->      107.703  -> "Oil"
        "Oil"                       ->      611.99   -> "Liquid"
        "Other waste"               ->      56.587   -> "Solid"
        "Other waste"               ->      77.81    -> "Bio-conversion"
        "Pumped heat"               ->      193.026  -> "Heating and cooling - homes"
        "Pumped heat"               ->      70.672   -> "Heating and cooling - commercial"
        "Solar PV"                  ->      59.901   -> "Electricity grid"
        "Solar Thermal"             ->      19.263   -> "Heating and cooling - homes"
        "Solar"                     ->      19.263   -> "Solar Thermal"
        "Solar"                     ->      59.901   -> "Solar PV"
        "Solid"                     ->      0.882    -> "Agriculture"
        "Solid"                     ->      400.12   -> "Thermal generation"
        "Solid"                     ->      46.477   -> "Industry"
        "Thermal generation"        ->      525.531  -> "Electricity grid"
        "Thermal generation"        ->      787.129  -> "Losses"
        "Thermal generation"        ->      79.329   -> "District heating"
        "Tidal"                     ->      9.452    -> "Electricity grid"
        "UK land based bioenergy"   ->      182.01   -> "Bio-conversion"
        "Wave"                      ->      19.013   -> "Electricity grid"
        "Wind"                      ->      289.366  -> "Electricity grid"
        `
        parser.parse(str);

      })
    });
  });
});
