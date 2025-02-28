---
title_tag: "Pulumi concepts: dependsOn resource option"
meta_desc: The dependsOn resource option specifies additional resource dependencies in addition to those in the dependency graph.
title: "dependsOn"
h1: "Resource option: dependsOn"
menu:
  concepts:
    identifier: dependsOn
    parent: options
    weight: 5
aliases:
- /docs/intro/concepts/resources/options/dependson/
---

The `dependsOn` resource option creates a list of explicit dependencies between resources.

Pulumi automatically tracks dependencies between resources when you supply an input argument that came from another resource’s output properties. In some cases, however, you may need to explicitly specify additional dependencies that Pulumi doesn’t know about but must still respect. This might happen if a dependency is external to the infrastructure itself—such as an application dependency—or is implied due to an ordering or eventual consistency requirement. The `dependsOn` option ensures that resource creation, update, and deletion operations are done in the correct order.

This example demonstrates how to make `res2` dependent on `res1`, even if there is no property-level dependency:

{{< chooser language "javascript,typescript,python,go,csharp,java,yaml" >}}

{{% choosable language javascript %}}

```javascript
let res1 = new MyResource("res1", {/*...*/});
let res2 = new MyResource("res2", {/*...*/}, { dependsOn: [res1] });
```

{{% /choosable %}}
{{% choosable language typescript %}}

```typescript
let res1 = new MyResource("res1", {/*...*/});
let res2 = new MyResource("res2", {/*...*/}, { dependsOn: [res1] });
```

{{% /choosable %}}
{{% choosable language python %}}

```python
res1 = MyResource("res1")
res2 = MyResource("res2", opts=ResourceOptions(depends_on=[res1]))
```

{{% /choosable %}}
{{% choosable language go %}}

```go
res1, _ := NewMyResource(ctx, "res1", &MyResourceArgs{/*...*/})
res2, _ := NewMyResource(ctx, "res2", &MyResourceArgs{/*...*/}, pulumi.DependsOn([]Resource{res1}))
```

{{% /choosable %}}
{{% choosable language csharp %}}

```csharp
var res1 = new MyResource("res1", new MyResourceArgs());
var res2 = new MyResource("res2", new MyResourceArgs(),
    new CustomResourceOptions { DependsOn = { res1 } });
```

{{% /choosable %}}
{{% choosable language java %}}

```java
var res1 = new MyResource("res1", new MyResourceArgs());
var res2 = new MyResource("res2",
    new MyResourceArgs(),
    CustomResourceOptions.builder()
        .dependsOn(res1)
        .build());
```

{{% /choosable %}}
{{% choosable language yaml %}}

```yaml
resources:
  res1:
    type: MyResource
  res2:
    type: MyResource
    options:
      dependsOn:
        - ${res1}
```

{{% /choosable %}}

{{< /chooser >}}
