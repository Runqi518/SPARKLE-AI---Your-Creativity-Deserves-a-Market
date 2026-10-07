"""Publish the exact Agent contracts and core craft guidance as readable docs."""

import json
from pathlib import Path


PROJECT = Path(__file__).resolve().parents[1]
DEFINITIONS = PROJECT / 'src/lib/studio/agents'
SKILLS = PROJECT / 'src/lib/studio/skills/library'
OUTPUT = PROJECT / 'docs/studio-agents'


def definition_from_ts(path: Path) -> dict:
    text = path.read_text(encoding='utf8')
    prefix = 'export const definition: AgentDefinition = '
    assert prefix in text, path
    return json.loads(text.split(prefix, 1)[1].rsplit(';', 1)[0])


def skill_body(skill_id: str) -> str:
    path = SKILLS / skill_id / 'SKILL.md'
    text = path.read_text(encoding='utf8')
    body = text.split('---\n', 2)[2].strip()
    lines = body.splitlines()
    assert lines[0].startswith('# '), path
    lines = lines[1:]
    # Place the entire executable craft method under its Agent heading.
    return '\n'.join('##' + line if line.startswith('#') else line for line in lines).strip()


def render(data: dict) -> str:
    name = data['name']
    dependencies = data['dependencies']
    sections = data['sections']
    core_ids = data.get('coreSkillIds', [])
    lines = [
        f'# {name}', '', data['purpose'], '',
        '## Role and execution boundary', '',
        f'This Agent owns the **{name}** deliverable. It receives the original brief and only successful outputs from selected upstream Agents. '
        'Absent upstream roles are not presumed to have run. Its core methods below are loaded into the actual Agent prompt; '
        'compatible selected skills can add methods without replacing this role’s output contract. '
        'It produces editable analysis and production instructions. A plan, prompt or asset request is not a rendered or approved media asset.', '',
        '**Selected upstream dependencies:** ' + (', '.join(dependencies) if dependencies else 'None.'), '',
        '## Required inputs', '',
        *[f'- {item}' for item in data['inputs']], '',
        'If a missing fact changes the claim, offer, audience, product depiction or deliverable feasibility, mark the role as needing input. '
        'For a noncritical gap, state a bounded assumption and identify the downstream decision it could affect.', '',
        '## Operating sequence', '',
        *[f'{i}. {step}' for i, step in enumerate(data['steps'], 1)], '',
        '## Structured handoff', '',
        'A ready result must provide every section below, in order. Use each section to make the next specialist’s decision executable, '
        'with factual basis, unresolved assumptions and explicit revision requests. The role also returns a concise summary and separate questions.', '',
        '| Section key | Deliverable | Acceptance content |',
        '| --- | --- | --- |',
        *[f'| `{item["key"]}` | {item["title"]} | {item["requirement"]} |' for item in sections], '',
        '## Role gates', '',
        *[f'- {check}' for check in data['checks']], '',
        'An unsupported claim, false asset-completion statement, missing required section or inconsistent timing fails the handoff. '
        'On failure, identify the earliest causal input and request a targeted correction; do not silently fill a missing evidence source.', '',
        '## Core craft methods loaded at runtime', '',
    ]
    for skill_id in core_ids:
        lines.extend([f'### {skill_id.replace("-", " ").title()}', '', skill_body(skill_id), ''])
    return '\n'.join(lines).rstrip() + '\n'


if __name__ == '__main__':
    count = 0
    for path in sorted(DEFINITIONS.glob('*.ts')):
        if path.name in {'index.ts', 'types.ts', 'execute.ts'}:
            continue
        data = definition_from_ts(path)
        target = OUTPUT / f'{data["id"]}.md'
        target.write_text(render(data), encoding='utf8')
        count += 1
    print(f'Wrote {count} Agent guides to {OUTPUT}')
