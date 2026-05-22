# Deployment Guide - Rust Backend

## Status: Ready to Deploy

All code is complete and ready. This guide provides exact commands to deploy.

---

## Step 1: Backup Current Files

```bash
cd /Users/blake/myspace/workease

# Backup original files
cp src-tauri/Cargo.toml src-tauri/Cargo.toml.backup
cp src-tauri/src/lib.rs src-tauri/src/lib.rs.backup
```

---

## Step 2: Deploy Updated Files

### Option A: Manual Copy (Recommended)

```bash
# Copy Cargo.toml
cat src-tauri/Cargo.toml.updated > src-tauri/Cargo.toml

# Copy lib.rs
cat src-tauri/src/lib.rs.complete > src-tauri/src/lib.rs
```

### Option B: Using cp Command

```bash
# If you have write permissions:
cp src-tauri/Cargo.toml.updated src-tauri/Cargo.toml
cp src-tauri/src/lib.rs.complete src-tauri/src/lib.rs
```

---

## Step 3: Verify Deployment

### Check Cargo.toml

```bash
# Should show tokio, glob, regex
grep "tokio\|glob\|regex" src-tauri/Cargo.toml
```

Expected output:
```
tokio = { version = "1", features = ["full"] }
glob = "0.3"
regex = "1.10"
```

### Check lib.rs

```bash
# Should show all 8 commands
grep -A 8 "invoke_handler" src-tauri/src/lib.rs
```

Expected output:
```
.invoke_handler(tauri::generate_handler![
    list_directory,
    read_file,
    write_file,
    get_folder_info,
    path_exists,
    execute_command,
    glob_files,
    grep_files
])
```

---

## Step 4: Build and Test

### Development Build

```bash
npm run tauri dev
```

Expected behavior:
- ✅ Tauri window opens
- ✅ No compilation errors
- ✅ Application starts normally
- ✅ Logs show "8 commands registered"

### Production Build

```bash
npm run tauri build
```

Expected behavior:
- ✅ Compiles without errors
- ✅ Creates binary in `src-tauri/target/release/`
- ✅ Bundles app for your platform

---

## Step 5: Test All Tools

Create a test script to verify all tools work:

```typescript
// test-tools.ts
import { executeTool } from './src/server/services/tools-v2';

async function testTools() {
  console.log('🧪 Testing WorkEase Tools...\n');

  // Test 1: Read
  console.log('1. Testing Read...');
  try {
    const result = await executeTool('Read', { file_path: 'package.json' });
    if (result.error) {
      console.error('   ❌ Read failed:', result.error);
    } else {
      console.log('   ✅ Read successful:', result.output.substring(0, 50) + '...');
    }
  } catch (e) {
    console.error('   ❌ Read error:', e);
  }

  // Test 2: Write
  console.log('\n2. Testing Write...');
  try {
    const result = await executeTool('Write', {
      file_path: 'test-output.txt',
      content: 'Hello from WorkEase!'
    });
    if (result.error) {
      console.error('   ❌ Write failed:', result.error);
    } else {
      console.log('   ✅ Write successful:', result.output);
    }
  } catch (e) {
    console.error('   ❌ Write error:', e);
  }

  // Test 3: Edit
  console.log('\n3. Testing Edit...');
  try {
    const result = await executeTool('Edit', {
      file_path: 'test-output.txt',
      old_string: 'Hello',
      new_string: 'Goodbye'
    });
    if (result.error) {
      console.error('   ❌ Edit failed:', result.error);
    } else {
      console.log('   ✅ Edit successful:', result.output);
    }
  } catch (e) {
    console.error('   ❌ Edit error:', e);
  }

  // Test 4: Bash
  console.log('\n4. Testing Bash...');
  try {
    const result = await executeTool('Bash', {
      command: 'echo "Test successful"'
    });
    if (result.error) {
      console.error('   ❌ Bash failed:', result.error);
    } else {
      console.log('   ✅ Bash successful:', result.output.trim());
    }
  } catch (e) {
    console.error('   ❌ Bash error:', e);
  }

  // Test 5: Glob
  console.log('\n5. Testing Glob...');
  try {
    const result = await executeTool('Glob', {
      pattern: '*.ts',
      path: './src/server'
    });
    if (result.error) {
      console.error('   ❌ Glob failed:', result.error);
    } else {
      const files = result.output.split('\n').filter(f => f);
      console.log(`   ✅ Glob successful: found ${files.length} files`);
    }
  } catch (e) {
    console.error('   ❌ Glob error:', e);
  }

  // Test 6: Grep
  console.log('\n6. Testing Grep...');
  try {
    const result = await executeTool('Grep', {
      pattern: 'export',
      path: './src/server/services',
      recursive: false
    });
    if (result.error) {
      console.error('   ❌ Grep failed:', result.error);
    } else {
      const matches = result.output.split('\n').filter(m => m);
      console.log(`   ✅ Grep successful: found ${matches.length} matches`);
    }
  } catch (e) {
    console.error('   ❌ Grep error:', e);
  }

  console.log('\n✨ Testing complete!');
}

testTools();
```

Run the test:
```bash
npx tsx test-tools.ts
```

---

## Step 6: Update TypeScript Tools

After Rust deployment, update `src/server/services/tools-v2.ts`:

### Add Imports

```typescript
import { executeCommand, globFiles, grepFiles } from '../../lib/tauri-commands-complete';
```

### Replace toolBash

```typescript
export async function toolBash(input: BashToolInput): Promise<ToolResult> {
    const { command, work_dir, timeout = 120000 } = input;

    try {
        console.log(`[Tool:Bash] Executing: ${command}`);

        // ✅ CONNECTED TO RUST
        const output = await executeCommand(command, work_dir, timeout);

        return {
            tool_name: 'Bash',
            tool_use_id: generateId(),
            output,
        };
    } catch (error) {
        return {
            tool_name: 'Bash',
            tool_use_id: generateId(),
            output: '',
            error: error instanceof Error ? error.message : String(error),
        };
    }
}
```

### Replace toolGlob

```typescript
export async function toolGlob(input: GlobToolInput): Promise<ToolResult> {
    const { pattern, path = '.' } = input;

    try {
        console.log(`[Tool:Glob] Searching: ${pattern}`);

        // ✅ CONNECTED TO RUST
        const files = await globFiles(pattern, path);

        const output = files.length > 0
            ? files.join('\n')
            : `No files found matching pattern: ${pattern}`;

        return {
            tool_name: 'Glob',
            tool_use_id: generateId(),
            output,
        };
    } catch (error) {
        return {
            tool_name: 'Glob',
            tool_use_id: generateId(),
            output: '',
            error: error instanceof Error ? error.message : String(error),
        };
    }
}
```

### Replace toolGrep

```typescript
export async function toolGrep(input: GrepToolInput): Promise<ToolResult> {
    const { pattern, path = '.', recursive = true, case_sensitive = false } = input;

    try {
        console.log(`[Tool:Grep] Searching for: ${pattern}`);

        // ✅ CONNECTED TO RUST
        const matches = await grepFiles(pattern, path, recursive, case_sensitive);

        const output = matches.length > 0
            ? matches.join('\n')
            : `No matches found for pattern: ${pattern}`;

        return {
            tool_name: 'Grep',
            tool_use_id: generateId(),
            output,
        };
    } catch (error) {
        return {
            tool_name: 'Grep',
            tool_use_id: generateId(),
            output: '',
            error: error instanceof Error ? error.message : String(error),
        };
    }
}
```

---

## Troubleshooting

### Error: "cannot find `glob` in this scope"

**Solution**: Add `use glob::glob;` inside the `glob_files` function

### Error: "cannot find `Regex` in this scope"

**Solution**: Add `use regex::Regex;` inside the `grep_files` function

### Error: "failed to resolve package"

**Solution**: Run `cargo clean` then rebuild:
```bash
cd src-tauri
cargo clean
cd ..
npm run tauri dev
```

### Error: Command not found

**Solution**: Make sure the command exists on your system. Test with simple commands like:
- `echo "test"`
- `ls`
- `pwd`

---

## Success Criteria

You'll know everything is working when:

✅ **Cargo.toml** has tokio, glob, regex
✅ **lib.rs** has 8 commands in invoke_handler
✅ **npm run tauri dev** starts successfully
✅ All 6 tools (Read, Write, Edit, Bash, Glob, Grep) work
✅ No compilation errors
✅ No runtime errors

---

## Next Steps After Deployment

1. ✅ Test all 6 tools individually
2. ✅ Verify error handling
3. ✅ Check edge cases
4. ✅ Move to next phase:
   - Frontend integration
   - Test framework
   - Database implementation
   - Claude SDK integration

---

**Status**: Ready to deploy
**Time**: 10-15 minutes
**Difficulty**: Beginner
**Risk**: Low (backups created)

---

## Quick Reference

### Files Changed
1. `src-tauri/Cargo.toml` - Add 3 dependencies
2. `src-tauri/src/lib.rs` - Add 3 commands + update invoke_handler

### Commands Added
1. `execute_command` - Run shell commands
2. `glob_files` - Find files by pattern
3. `grep_files` - Search file contents

### Tools Now Working
- ✅ Read (file)
- ✅ Write (file)
- ✅ Edit (file)
- ✅ Bash (NEW!)
- ✅ Glob (NEW!)
- ✅ Grep (NEW!)
